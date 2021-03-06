import { find, last, propEq } from 'ramda'
import React, { useCallback, useMemo } from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import PanelHeader from './panel-header'
import ConversationDelete from './conversation-delete'
import TextInput from './text-input'
import ContactList from './contact-list'
import { fontLarge } from './typography'
import { scrollbar } from './scrollbar'
import { getStaticUrl } from '../utils/common-util'
import { getGroupDefaultName, getGroupName } from '../utils/conversation-util'
import { filterSortMessages } from '../utils/message-util'
import * as ConversationAction from '../actions/conversation-action'
import LoginStore from '../stores/login-store'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import MessageListStore from '../stores/message-list-store'

const GroupIcon = styled.img`
  height: 14px;
  width: 18px;
  vertical-align: top;
  margin: 3px 10px 0 0;
`

const TitleText = styled.div`
  display: inline-block;
  max-width: calc(100% - 28px);
  overflow: hidden;
  text-overflow: ellipsis;
`

const Scrollbar = styled.div`
  ${scrollbar}
`

const GroupNameContainer = styled.div`
  max-width: 100%;
  width: 975px;
  padding: 0 20px;
  margin: 0 auto;
  box-sizing: border-box;
`

const GroupNameTitle = styled.div`
  ${fontLarge}
  margin: 15px 0;
`

const useBdux = createUseBdux({
  login: LoginStore,
  contactList: ContactListStore,
  conversationList: ConversationListStore,
  messageList: MessageListStore,
})

const Group = props => {
  const { converseUuid } = useParams()
  const { state: { login, contactList, conversationList, messageList }, dispatch } = useBdux(props)
  const { pair: { pub: loginPub } } = login
  const { contacts } = contactList
  const { conversations } = conversationList
  const { messages } = messageList

  // find the conversation by uuid in url.
  const conversation = useMemo(() => (
    find(propEq('uuid', converseUuid), conversations)
  ), [conversations, converseUuid])

  // find the last message in the conversation.
  const conversePub = conversation?.conversePub
  const lastMessage = useMemo(() => (
    last(filterSortMessages(loginPub, conversePub)(messages))
  ), [conversePub, loginPub, messages])

  // tick the current group members.
  const checkedPubs = useMemo(() => (
    conversation?.memberPubs.reduce((accum, memberPub) => {
      if (loginPub !== memberPub) {
        accum[memberPub] = true
      }
      return accum
    }, {}) || {}
  ), [conversation, loginPub])

  // handle enter and escape key for group name.
  const handleGroupNameKeyDown = useCallback(e => {
    if (e.keyCode === 13) {
      e.target.blur()
    } if (e.keyCode === 27) {
      const { target } = e
      target.value = conversation.name || ''
      target.blur()
    }
  }, [conversation])

  // handle blur to rename the group.
  const handleGroupNameBlur = useCallback(e => {
    const { value } = e.target
    if (conversation.name !== value) {
      dispatch(ConversationAction.updateGroupName(conversation, value))
    }
  }, [conversation, dispatch])

  if (!conversation) {
    // unknown conversation.
    return (
      <PanelHeader>
        {''}
        <ConversationDelete
          conversation={conversation}
          login={login}
          dispatch={dispatch}
        />
      </PanelHeader>
    )
  }

  return (
    <>
      <PanelHeader href={`/conversation/${converseUuid}`}>
        <>
          <GroupIcon
            src={getStaticUrl('/icons/user-group.svg')}
            alt="Group"
          />
          <TitleText>
            {getGroupName(login, contacts, conversation)
              || conversation.conversePub}
          </TitleText>
        </>
        <ConversationDelete
          conversation={conversation}
          login={login}
          dispatch={dispatch}
        />
      </PanelHeader>
      <Scrollbar>
        <GroupNameContainer>
          <GroupNameTitle>Group name</GroupNameTitle>
          <TextInput
            name="group"
            value={conversation.name}
            placeholder={getGroupDefaultName(login, contacts, conversation)}
            autoComplete="off"
            onKeyDown={handleGroupNameKeyDown}
            onBlur={handleGroupNameBlur}
          />
        </GroupNameContainer>
        <ContactList
          checkedPubs={checkedPubs}
          conversation={conversation}
          nextPair={lastMessage?.nextPair || conversation.nextPair}
        />
      </Scrollbar>
    </>
  )
}

export default React.memo(Group)
