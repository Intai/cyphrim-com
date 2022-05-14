import React from 'react'
import styled from 'styled-components'
import { Outlet } from 'react-router'
import { createUseBdux } from 'bdux/hook'
import {
  updateRouterLocation,
  Router,
  Routes,
  Route,
} from 'bdux-react-router'
import QrCode from './qr-code'
import Conversation from './conversation'
import Invite from './invite'
import InviteScan from './invite-scan'
import InviteResult from './invite-result'
import { useResponsive } from '../hooks/responsive'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import MessageListStore from '../stores/message-list-store'

const Container = styled.div`
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ContainerOutlet = () => (
  <Container>
    <Outlet />
  </Container>
)

const InviteForMdAndUp = () => {
  const { isBreakpointUp } = useResponsive()

  return isBreakpointUp('md') && (
    <Container>
      <Invite />
    </Container>
  )
}

const useBdux = createUseBdux({
  contactList: ContactListStore,
  conversationList: ConversationListStore,
  messageList: MessageListStore,
})

const PanelRight = props => {
  const { location } = props
  const { state: { contactList, conversationList, messageList } } = useBdux(props)

  // wait for contacts and conversations are initialised.
  return contactList && conversationList && messageList && (
    <Router location={updateRouterLocation(location)}>
      <Routes>
        <Route
          // don't render the right panel on sm and md screens
          // when showing a list of conversations.
          element={<InviteForMdAndUp />}
          path="/conversations"
        />
        <Route
          element={<ContainerOutlet />}
          path="/"
        >
          <Route
            element={<QrCode />}
            path="qr-code"
          />
          <Route
            element={<InviteScan />}
            path="invite/scan"
          />
          <Route
            element={<InviteResult />}
            path="invite"
          />
          <Route
            element={<Invite />}
            path="conversation/new"
          />
          <Route
            element={<Conversation />}
            path="conversation/:converseUuid"
          />
          <Route
            element={<Invite />}
            path="*"
          />
          <Route
            element={<Invite />}
            index
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default React.memo(PanelRight)
