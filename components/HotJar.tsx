"use client"
import { useEffect } from "react"

const HotJar = () => {
  useEffect(() => {
    // Insert Hotjar tracking code into the head section
    const script = document.createElement("script")
    script.innerHTML = `
            (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:5154140,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `
    document.head.appendChild(script)

    return () => {
      // Cleanup if necessary
      document.head.removeChild(script)
    }
  }, [])

  return null
}

export default HotJar
