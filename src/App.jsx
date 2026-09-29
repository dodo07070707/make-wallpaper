import { useEffect, useRef, useState } from "react";
import lockScreenImg from "./assets/lockscreen.png";

// 아이폰 스크린샷(1206x2622) 기준 수치
const W = 1206;
const H = 2622;
const MARGIN = 79;
const MAX_FONT = 51; // 17pt × 3
const LINE_RATIO = 1.53;
const FONT_WEIGHT = 300;
const FONT_FAMILY =
  "-apple-system, system-ui, 'Apple SD Gothic Neo', sans-serif";
const COLOR = "#dcdcdc";
const MAX_TEXT_WIDTH = W / 2 - MARGIN;
const TOP = H * 0.565; // 기본 시작 위치
const MIN_TOP = (H * 3) / 7; // 길어도 이 위로는 안 올라감
const BOTTOM = H - 330; // 잠금화면 손전등/카메라 버튼 위

function draw(canvas, text) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const lines = text.split("\n");
  ctx.font = `${FONT_WEIGHT} ${MAX_FONT}px ${FONT_FAMILY}`;
  const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
  const fitWidth = (MAX_FONT * MAX_TEXT_WIDTH) / widest;
  const fitHeight = (BOTTOM - MIN_TOP) / (lines.length * LINE_RATIO);
  const size = Math.min(MAX_FONT, fitWidth, fitHeight);
  const lineHeight = size * LINE_RATIO;

  ctx.font = `${FONT_WEIGHT} ${size}px ${FONT_FAMILY}`;
  ctx.fillStyle = COLOR;
  ctx.textBaseline = "middle";
  // TOP 지점에서 시작, 아래가 넘치면 3/7 지점까지만 끌어올림
  const top = Math.max(
    MIN_TOP,
    Math.min(TOP, BOTTOM - lines.length * lineHeight)
  );
  lines.forEach((l, i) =>
    ctx.fillText(l, MARGIN, top + lineHeight * (i + 0.5))
  );
}

// 문구 영역(3/7 ~ BOTTOM)을 가리고 시계·위젯·하단 버튼만 남김
const LOCK_MASK = `linear-gradient(#000 ${
  (MIN_TOP / H) * 100
}%, transparent 0 ${(BOTTOM / H) * 100}%, #000 0)`;

export default function App() {
  const [text, setText] = useState("");
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => draw(canvasRef.current, text), [text]);

  // 키보드가 올라오면 입력 영역 아래끝이 키보드 바로 위에 오도록 스크롤
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const controls = controlsRef.current;
      if (!controls.contains(document.activeElement)) return;
      const bottom = controls.getBoundingClientRect().bottom;
      window.scrollBy({
        top: bottom - (vv.offsetTop + vv.height) + 16,
        behavior: "smooth",
      });
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const download = () => {
    const url = canvasRef.current.toDataURL("image/png");
    // 휴대폰: 공유 시트의 "이미지 저장"으로 사진 앱에 바로 저장
    // (toBlob은 비동기라 Safari가 공유를 막을 수 있어 동기 변환)
    const bytes = Uint8Array.from(atob(url.split(",")[1]), (c) =>
      c.charCodeAt(0)
    );
    const file = new File([bytes], "wallpaper.png", { type: "image/png" });
    const isMobile = matchMedia("(pointer: coarse)").matches;
    if (isMobile && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => {});
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = "wallpaper.png";
    a.click();
  };

  return (
    <main
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        padding: 16,
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(300px, 100%)",
          border: "1px solid #333",
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", display: "block" }}
        />
        <img
          src={lockScreenImg}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            maskImage: LOCK_MASK,
          }}
        />
      </div>
      <div
        ref={controlsRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "min(320px, 100%)",
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="문구를 입력하세요"
          rows={12}
          style={{
            font: "inherit",
            fontSize: 16,
            padding: 12,
            background: "#000",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 8,
          }}
        />
        <button
          onClick={download}
          style={{
            font: "inherit",
            padding: 12,
            borderRadius: 8,
            border: 0,
            cursor: "pointer",
          }}
        >
          PNG 저장
        </button>
      </div>
    </main>
  );
}
