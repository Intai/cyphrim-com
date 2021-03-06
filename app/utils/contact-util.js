import { F, identity, memoizeWith, pick, pipe } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import { Sea, getGun, gunOnce } from './gun-util'
import { getAuthUser, getAuthPair } from './login-util'

const uuidCache = {}
const nameCache = {}

const cleanContact = pick([
  'alias',
  'name',
  'epub',
  'pub',
])

// memoize because only need to subscrube to each contact once.
const updateContact = memoizeWith(identity, (pub, cb) => {
  let ev
  if (!pub) {
    return F
  }

  getGun()
    .user(pub)
    .get('name')
    .on((name, _key, _msg, _ev) => {
      ev = _ev
      if (nameCache[pub] !== name) {
        nameCache[pub] = name
        setContact(pub, data => {
          if (!data.err) {
            cb(data)
          }
        })
      }
    })

  return () => {
    if (ev) {
      ev.off()
    }
  }
})

const pushUnsub = (unsub, unsubs) => {
  if (unsubs.indexOf(unsub) < 0) {
    unsubs.push(unsub)
  }
}

export const getContact = cb => {
  const unsubs = []
  let ev

  // get contact when created or updated.
  getAuthUser()
    .get('contacts')
    .map()
    .on((encrypted, _key, _msg, _ev) => {
      ev = _ev
      if (encrypted) {
        Sea.decrypt(encrypted, getAuthPair()).then(contact => {
          if (contact) {
            const { uuid, pub, name } = contact
            uuidCache[pub] = uuid
            nameCache[pub] = name
            cb(contact)

            // subscribe to contact name changes.
            const unsub = updateContact(pub, cb)
            pushUnsub(unsub, unsubs)
          }
        })
      }
    })

  return () => {
    if (unsubs.length > 0) {
      pipe(...unsubs)()
    }
    if (ev) {
      ev.off()
    }
  }
}

const whenUser = user => (
  !user || user.pub
)

export const setContact = (pub, cb) => {
  if (!pub) {
    cb({ err: 'Invalid invite URL.' })
    return
  }

  getGun().user(pub).on(gunOnce(whenUser, data => {
    if (!data) {
      cb({ err: 'Invalid invite URL.' })
    } else {
      const uuid = uuidCache[pub] || uuidv4()
      uuidCache[pub] = uuid
      nameCache[pub] = data.name
      const contact = {
        ...cleanContact(data),
        uuid,
      }

      Sea.encrypt(contact, getAuthPair()).then(encrypted => {
        getAuthUser()
          .get('contacts')
          .get(`contact-${uuid}`)
          .put(encrypted)

        cb(contact)
      })
    }
  }))
}

export const removeContact = contact => {
  getAuthUser()
    .get('contacts')
    .get(`contact-${contact.uuid}`)
    .put(null)
}

export const getContactName = contact => {
  if (contact) {
    const { alias, name, pub } = contact
    return name || alias || pub
  }
  return null
}
