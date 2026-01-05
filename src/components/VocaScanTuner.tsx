import React, { useState } from "react";
import { usePitchEngine } from "../hooks/usePitchEngine";

const VocaScanTuner: React.FC = () => {
  const [sessionInfo] = useState(() => {
    const query = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return {
      userId: query.get("userId") || "guest_user",
      sessionId: query.get("sessionId") || "direct_access",
    };
  });

  const { 
    isRunning, isAnalyzing, isCountingDown, countdown,
    pitch, note, confidence, diagnosis, error, start, stop 
  } = usePitchEngine();

  const hubUrl = import.meta.env.DEV ? "http://localhost:5173" : "https://app.voca-nical.com";

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden border border-gray-100">
        
        <header className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-black text-blue-600 italic tracking-tighter">VocaScan Tuner V6.1</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">3-Sec Countdown Stabilized</p>
        </header>

        {/* ディスプレイエリア */}
        <div className={`rounded-3xl p-10 text-center mb-8 transition-all duration-500 min-h-[260px] flex flex-col justify-center
          ${isRunning ? "bg-blue-50 ring-8 ring-blue-50/50 scale-105" : 
            isCountingDown ? "bg-slate-900 shadow-[0_0_40px_rgba(59,130,246,0.3)]" : "bg-gray-50"}`}>
          
          <div className="text-8xl font-mono font-black tracking-tighter flex items-center justify-center">
            {isCountingDown ? (
              // key={countdown}により、数字が変わるたびにアニメーションがリセットされる
              <span key={countdown} className="text-blue-400 animate-[ping_0.5s_ease-in-out_1]">
                {countdown}
              </span>
            ) : (
              <span className={isRunning ? "text-slate-800" : "text-slate-300"}>
                {isRunning ? (note || "---") : "---"}
              </span>
            )}
          </div>

          <div className={`text-xl font-bold mt-4 transition-colors duration-300 ${isCountingDown ? "text-blue-200" : "text-blue-500"}`}>
            {isCountingDown ? "READY..." : (isRunning && pitch ? `${pitch.toFixed(1)} Hz` : "WAITING")}
          </div>

          {isRunning && (
            <div className="mt-6 w-full animate-in fade-in duration-700">
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(confidence * 100).toFixed(0)}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                Confidence: {(confidence * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="space-y-4">
          {!isRunning ? (
            <button 
              onClick={start} 
              disabled={isCountingDown}
              className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3
                ${isCountingDown
                  ? "bg-slate-700 cursor-not-allowed text-blue-400" 
                  : "bg-slate-900 text-white hover:bg-black"}`}
            >
              {isCountingDown ? `START IN ${countdown}...` : "診断スタート"}
            </button>
          ) : (
            <button 
              onClick={stop} 
              disabled={isAnalyzing} 
              className={`w-full py-5 rounded-2xl font-black text-xl text-white transition-all shadow-xl
                ${isAnalyzing ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 animate-pulse active:scale-95"}`}
            >
              {isAnalyzing ? "解析中…" : "停止して解析"}
            </button>
          )}
        </div>

        {/* 診断結果表示（以前のスタイリングを維持） */}
        <div className="mt-8 pt-4">
          {error && <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center text-red-500 font-bold text-sm">{error}</div>}
          
          {diagnosis && !error && !isAnalyzing && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 text-center">
              <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl text-white shadow-lg">
                <p className="text-[10px] font-bold opacity-70 tracking-widest uppercase">Total Score</p>
                <div className="text-6xl font-black tracking-tighter">{diagnosis.score}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Pitch</p>
                  <p className="text-xl font-black text-slate-700">{diagnosis.pitch.toFixed(1)}Hz</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Stability</p>
                  <p className="text-xl font-black text-slate-700">{(diagnosis.stability * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <a href={hubUrl} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest">
            ← APPS HUB に戻る
          </a>
        </div>
      </div>
      <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">© 2026 Voca-nical Apps</p>
    </div>
  );
};

export default VocaScanTuner;