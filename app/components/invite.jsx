import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import PanelHeader from './panel-header'
import Anchor from './anchor'
import ContactList from './contact-list'
import { inputBackground } from './color'
import { fontLarge, fontSmall } from './typography'
import { scrollbar } from './scrollbar'
import { canUseDOM, getAppUrl, getStaticUrl } from '../utils/common-util'
import LoginStore from '../stores/login-store'

const Scrollbar = styled.div`
  ${scrollbar}
`

const Canvas = styled.canvas`
  max-width: 100%;
  object-fit: contain;
  object-position: bottom;
  margin: 15px auto;
  display: block;
`

const InviteMessageWrap = styled.div`
  text-align: center;
`

const InviteMessage = styled.div`
  ${fontLarge}
  display: inline-block;
  padding: 15px 20px 30px 20px;
  text-align: left;
  max-width: 100%;
  width: 330px;
  box-sizing: border-box;
`

const InviteAnchor = styled(Anchor)`
  display: inline-block;
  margin-top: 5px;
`

const CopyContainer = styled.div`
  display: inline-block;
  vertical-align: top;
  position: relative;
`

const CopyIcon = styled.img`
  vertical-align: top;
  margin: 6px 0 0 10px;
  height: 1em;
  opacity: 0.5;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`

const CopyTooltip = styled.div`
  ${fontSmall}
  ${inputBackground}
  color: #000;
  position: absolute;
  top: -36px;
  left: -48px;
  display: none;
  white-space: nowrap;
  padding: 10px;
  pointer-events: none;
  ${({ isCopied }) => isCopied && 'display: block;'}
`

const getFromText = profileName => {
  if (profileName) {
    const truncated = (profileName.length > 10)
      ? `${profileName.slice(0, 10)}…`
      : profileName
    return ` from ${truncated}`
  }
  return ''
}

const useBdux = createUseBdux({
  login: LoginStore,
})

const Invite = (props) => {
  const { state: { login }, dispatch } = useBdux(props)
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef()
  const { alias, name, pair } = login
  const profileName = name || alias
  const canShare = canUseDOM() && navigator.share

  const setCanvasNode = useCallback((node) => {
    if (node) {
      QRCode.toCanvas(node, pair.pub)
    }
  }, [pair])

  const handleInviteScan = useCallback(e => {
    dispatch(LocationAction.push(e.currentTarget.href))
    e.preventDefault()
  }, [dispatch])

  // replace dots to avoid routing confusion. assuming there is no
  // space in public key. need to convert back on the receiving end.
  const inviteUrl = getAppUrl(`/invite?pub=${pair.pub}`)

  const handleShare = useCallback(e => {
    if (canShare) {
      navigator.share({
        title: `CyphrIM invite${getFromText(profileName)}`,
        url: inviteUrl,
      })
      e.preventDefault()
    }
  }, [canShare, inviteUrl, profileName])

  const handleCopy = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
      setIsCopied(true)

      // dismiss the tooltip after 300ms.
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setIsCopied(false)
      }, 1000)
    }
  }, [inviteUrl])

  useEffect(() => () => {
    // clean up timeout for the copyied tooltip.
    clearTimeout(timeoutRef.current)
  }, [])

  return (
    <>
      <PanelHeader>New conversation</PanelHeader>
      <Scrollbar>
        <Canvas ref={setCanvasNode} />

        <InviteMessageWrap>
          <InviteMessage>
            {'This is your invite QR code. To invite a new contact. Please either '}
            <InviteAnchor
              href="/invite/scan"
              kind="primary"
              onClick={handleInviteScan}
            >
              {'Scan their invite QR code'}
            </InviteAnchor>
            {' or '}
            <InviteAnchor
              href={`mailto:?subject=CyphrIM%20invite${getFromText(profileName)}&body=${inviteUrl}`}
              kind="primary"
              onClick={handleShare}
            >
              {canShare ? 'Share': 'Email'}
              {' your invite link'}
            </InviteAnchor>
            <CopyContainer>
              <CopyIcon
                src={getStaticUrl('/icons/clone.svg')}
                title="Copy your invite link"
                onClick={handleCopy}
              />
              <CopyTooltip isCopied={isCopied}>
                {'Your invite link copied'}
              </CopyTooltip>
            </CopyContainer>
          </InviteMessage>
        </InviteMessageWrap>

        <ContactList />
      </Scrollbar>
    </>
  )
}

export default React.memo(Invite)
