import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import { fontLarge } from './typography'
import { getStaticUrl } from '../utils/common-util'

const Container = styled.div`
  flex: 0 0 auto;
  display: flex;
`

const BackAnchor = styled.a`
  flex: 0 0 auto;
`

const BackIcon = styled.img`
  height: 20px;
  padding: 25px 15px 15px 20px;
  vertical-align: top;
  cursor: pointer;
`

const Title = styled.div`
  ${fontLarge}
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 24px 15px 15px 0;
`

const PanelHeader = props => {
  const { href, children } = props
  const { dispatch } = useBdux(props)

  const handleShowConversations = useCallback(e => {
    dispatch(LocationAction.push(e.currentTarget.href))
    e.preventDefault()
  }, [dispatch])

  return (
    <Container>
      <BackAnchor
        href={href || '/conversations'}
        onClick={handleShowConversations}
      >
        <BackIcon src={getStaticUrl('/icons/angle-left.svg')} />
      </BackAnchor>
      <Title>{children}</Title>
    </Container>
  )
}

export default React.memo(PanelHeader)