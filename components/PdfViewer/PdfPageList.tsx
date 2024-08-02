import React from "react"
import { FixedSizeList } from "react-window"
import PdfPage from "./PdfPage"
import { useRemoteStore } from "@/store/useRemoteStore"

type PdfPageListProps = {
  height: number
  width: number
  numPages: number
  pageHeight: number | undefined
  pageScale: number
  handleItemsRendered: ({
    // eslint-disable-next-line no-unused-vars
    visibleStartIndex,
    // eslint-disable-next-line no-unused-vars
    visibleStopIndex,
  }: {
    visibleStartIndex: number
    visibleStopIndex: number
  }) => void
  // eslint-disable-next-line no-unused-vars
  setListRef: (ref: FixedSizeList<any> | null) => void
  // eslint-disable-next-line no-unused-vars
  setOuterListRef: (ref: HTMLElement | null) => void
}

const PdfPageList: React.FC<PdfPageListProps> = ({
  height,
  width,
  numPages,
  pageHeight,
  pageScale,
  handleItemsRendered,
  setListRef,
  setOuterListRef,
}) => {
  console.log("PdfPageList")
  const toggleRemoteState = useRemoteStore((state) => state.toggleRemoteState)
  return (
    <>
      <button onClick={toggleRemoteState}>Toggle Remote State</button>
      <FixedSizeList
        ref={setListRef}
        outerRef={setOuterListRef}
        className="mb-4 bg-white"
        height={height}
        itemCount={numPages}
        itemSize={pageHeight ? pageHeight * pageScale : height * pageScale}
        width={width}
        onItemsRendered={handleItemsRendered}
      >
        {({ index, style }) => (
          <PdfPage index={index} style={style} width={width} />
        )}
      </FixedSizeList>
    </>
  )
}

export default PdfPageList
