import {
  converge,
  equals,
  find,
  findIndex,
  identity,
  mergeDeepRight,
  pathEq,
  prop,
  propEq,
  remove,
  update,
  when,
} from 'ramda'
import { Bus } from 'baconjs'
import { createStore } from 'bdux/store'
import StoreNames from './store-names'
import ActionTypes from '../actions/action-types'

const isAction = pathEq(
  ['action', 'type'],
)

const append = (contact, contacts) => {
  const source = contacts || []
  const current = find(propEq('pub', contact.pub), source)

  if (!current) {
    return source.concat(contact)
  }
  if (!equals(current, contact)) {
    const index = source.indexOf(current)
    return update(index, contact, source)
  }
  return source
}

const removePublicKey = (pub, contacts) => {
  const source = contacts || []
  const index = findIndex(propEq('pub', pub), source)
  return (index < 0)
    ? source
    : remove(index, 1, source)
}

const whenInit = when(
  isAction(ActionTypes.CONTACT_INIT),
  converge(mergeDeepRight, [
    identity,
    ({ state }) => ({
      state: {
        contacts: state?.contacts || [],
        err: null,
      },
    }),
  ])
)

const whenAppend = when(
  isAction(ActionTypes.CONTACT_APPEND),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { contact } }) => ({
      state: {
        contacts: append(contact, state?.contacts),
        err: null,
      },
    }),
  ])
)

const whenInviteError = when(
  isAction(ActionTypes.CONTACT_INVITE_ERROR),
  converge(mergeDeepRight, [
    identity,
    ({ action: { err } }) => ({
      state: {
        err,
      },
    }),
  ])
)

const whenDelete = when(
  isAction(ActionTypes.CONTACT_DELETE),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { pub } }) => ({
      state: {
        contacts: removePublicKey(pub, state?.contacts),
        err: null,
      },
    }),
  ])
)

const whenClearInviteError = when(
  isAction(ActionTypes.CONTACT_CLEAR_INVITE_ERROR),
  converge(mergeDeepRight, [
    identity,
    () => ({
      state: {
        err: null,
      },
    }),
  ])
)

export const getReducer = () => {
  const reducerStream = new Bus()
  return {
    input: reducerStream,
    output: reducerStream
      .map(whenInit)
      .map(whenAppend)
      .map(whenInviteError)
      .map(whenClearInviteError)
      .map(whenDelete)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.CONTACT_LIST, getReducer,
)