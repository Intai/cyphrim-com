import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import QrScanner from 'qr-scanner'
import { useBdux } from 'bdux/hook'
import Button from './button'
import Select from './select'
import { alertBackground, secondaryBorder } from './color'
import { jsonParse } from '../utils/common-util'
import * as LoginAction from '../actions/login-action'

const Video = styled.video`
  ${secondaryBorder}
  border: 1px solid;
  width: calc(100vw - 30px);
  max-height: calc(100vh - 142px);
  margin: 15px 0 20px;
  position: relative;
`

const ErrorMessage = styled.div`
  ${alertBackground}
  padding: 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;
  white-space: pre-wrap;
`

const LoginScan = (props) => {
  const { login, onCancel } = props
  const { dispatch } = useBdux(props)
  const [isBlocked, setIsBlocked] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [cameras, setCameras] = useState([])
  const qrScannerRef = useRef()

  const setVideoNode = useCallback((node) => {
    if (node) {
      const qrScanner = new QrScanner(node, result => {
        const pair = jsonParse(result.data)
        if (pair) {
          // try to login by the pair from qr code.
          dispatch(LoginAction.scanQrCode(pair))
        }
      }, {
        highlightScanRegion: true,
      })

      // start scanning and keep a reference to detroy when unmounting.
      qrScannerRef.current = qrScanner
      qrScanner.start().catch(() => {
        setIsBlocked(true)
      })
    }
  }, [dispatch])

  useEffect(() => {
    // detect cameras.
    QrScanner.hasCamera().then(setHasCamera)
    QrScanner.listCameras().then(setCameras)

    return () => {
      const { current: qrScanner } = qrScannerRef
      if (qrScanner) {
        // clean up the scanner library.
        qrScanner.destroy()
      }
    }
  }, [])

  const handleChangeCamera = useCallback((e) => {
    const { current: qrScanner } = qrScannerRef
    if (qrScanner) {
      // select a different camera.
      qrScanner.setCamera(e.target.value)
    }
  }, [])

  const hasCameraNotBlocked = hasCamera && !isBlocked
  const errorMessage = login?.err
    || (!hasCameraNotBlocked && 'There is no camera detected.')

  return (
    <>
      <Video ref={setVideoNode} />
      <div>
        {errorMessage && (
          <ErrorMessage>⚠️  {errorMessage}</ErrorMessage>
        )}

        {hasCameraNotBlocked && (
          <Select onChange={handleChangeCamera}>
            {cameras.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
        )}

        <Button
          type="button"
          kind="secondary"
          onClick={onCancel}
        >
          {'Cancel'}
        </Button>
      </div>
    </>
  )
}

export default React.memo(LoginScan)
