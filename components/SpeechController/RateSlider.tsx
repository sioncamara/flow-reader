import React from "react"
import { Slider } from "../ui/slider"

type RateSliderProps = {
  tempRate: number
  setTempRate: (rate: number) => void
  handleRateChangeEnd: () => void
}

const RateSlider = ({
  tempRate,
  setTempRate,
  handleRateChangeEnd,
}: RateSliderProps) => {
  return (
    <>
      {/* <span className="mb-2 text-sm">
        Rate: {tempRate.toFixed(1) || rate.toFixed(1)}
      </span> */}

      <div className="flex flex-col items-center">
        <Slider
          id="rate-slider"
          min={0.5}
          max={2}
          step={0.02}
          value={[tempRate]}
          onValueChange={(value) => setTempRate(value[0])}
          onValueCommit={handleRateChangeEnd}
          className="relative h-60 w-2"
          orientation="vertical"
        />
      </div>
      <div className=" flex h-[15rem] flex-col justify-between self-center ">
        {[2, 1.75, 1.5, 1.25, 1, 0.75, 0.5].map((value) => (
          <React.Fragment key={value}>
            <div className="flex items-center">
              <div
                className={`h-px ${[2, 1.5, 1, 0.5].includes(value) ? "w-3" : "w-2"} bg-slate-300`}
              />
              {[2, 1.5, 1, 0.5].includes(value) && (
                <span className="ml-2 text-xs text-slate-500">
                  {value === 2
                    ? "Fast"
                    : value === 1.5
                      ? "Faster"
                      : value === 1
                        ? "Normal"
                        : "Slow"}
                </span>
              )}
            </div>
            {/* {index < 6 && (
              <div className="flex items-center">
                <div className="h-px w-1 bg-slate-300" />
              </div>
            )} */}
          </React.Fragment>
        ))}
      </div>
    </>
  )
}

export default RateSlider
