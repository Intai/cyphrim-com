import { count, find, propEq } from 'ramda'
import React, { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import { primaryBackground, secondaryText } from './color'
import { getStaticUrl } from '../utils/common-util'
import { getContactName } from '../utils/contact-util'
import { getGroupName } from '../utils/conversation-util'
import { isMessageVisible } from '../utils/message-util'

const ListItem = styled.li`
  display: block;
  padding: 15px 20px 15px 30px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  ${({ isSelected, ...args }) => isSelected && primaryBackground(args)}

  &:hover {
    ${primaryBackground}
  }
`

const Label = styled.div`
  flex: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

const Count = styled.div`
  ${secondaryText}
  flex: 0 0 auto;
  padding-left: 10px;
`

const GroupIcon = styled.img`
  flex: 0 0 auto;
  height: 14px;
  padding: 0 10px 0 0;
`

const isNewMessageInConversation = (loginPub, conversePub, lastTimestamp) => message => {
  const { conversePub: messageConversePub, fromPub, timestamp } = message

  // count only visible messages.
  return isMessageVisible(message)
    // if the message is newer.
    && (!lastTimestamp || timestamp > lastTimestamp)
    // message from myself in the conversation.
    // or messages in a group chat.
    && (conversePub === messageConversePub
      // or from the other user.
      || (loginPub === messageConversePub && conversePub === fromPub))
}

const ConversationListItem = ({ login, contacts, conversation, messages, isSelected, dispatch }) => {
  const { pair: { pub: loginPub } } = login
  const { uuid, conversePub, memberPubs, lastTimestamp } = conversation
  const contact = find(propEq('pub', conversePub), contacts)
  const label = getContactName(contact)
    || getGroupName(login, contacts, conversation)
    || conversePub

  const handleSelect = useCallback(() => {
    dispatch(LocationAction.push(`/conversation/${uuid}`))
  }, [dispatch, uuid])

  const newCount = useMemo(() => (
    count(isNewMessageInConversation(loginPub, conversePub, lastTimestamp), messages)
  ), [conversePub, lastTimestamp, loginPub, messages])

  return (
    <ListItem
      isSelected={isSelected}
      onClick={handleSelect}
    >
      {memberPubs && (
        <GroupIcon
          src={getStaticUrl('/icons/user-group.svg')}
          alt="Group"
        />
      )}
      <Label>{label}</Label>
      {!!newCount && !isSelected && <Count>{newCount} new</Count>}
    </ListItem>
  )
}

export default React.memo(ConversationListItem)
