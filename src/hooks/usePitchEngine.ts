import { useRef, useState, useEffect, useCallback } from "react";
import { CrepeEngine } from "../audio/CrepeEngine";
import { PitchData, DiagnosisResult } from "../types/pitch";

export function usePitchEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<CrepeEngine | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const [isRunning, setIsRunning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [latestPitch, setLatestPitch] = useState<PitchData | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (isRunning || isPreparing || isAnalyzing || isCountingDown) return;
    
    setError(null);
    setDiagnosis(null);
    setIsCountingDown(true);
    setCountdown(3);

    try {
      // --- 1. 裏側でリソース準備を開始 ---
      if (audioContextRef.current) await audioContextRef.current.close();
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioContextRef.current = new AudioContextClass();
      if (!engineRef.current) engineRef.current = new CrepeEngine();

      // モデルのロードを開始（awaitせず、カウントダウンと並行させる）
      const enginePromise = engineRef.current.start(audioContextRef.current, (data: PitchData) => {
        const now = performance.now();
        if (now - lastUpdateTimeRef.current > 33) {
          setLatestPitch(data);
          lastUpdateTimeRef.current = now;
        }
      });

      // --- 2. 正確な3秒カウントダウン (3 -> 2 -> 1) ---
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        // 厳密に1000ms待機
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // --- 3. 準備がまだならここで最終同期（通常は3秒以内に終わる） ---
      await enginePromise;

      setIsCountingDown(false);
      setIsRunning(true);
    } catch (err: any) {
      console.error("Start Error:", err);
      setError("マイクの起動に失敗しました。");
      setIsCountingDown(false);
      setIsRunning(false);
    }
  }, [isRunning, isPreparing, isAnalyzing, isCountingDown]);

  const stop = useCallback(async () => {
    if (!isRunning || isAnalyzing || !engineRef.current) return;
    setIsAnalyzing(true);
    // 停止時に即リセット
    setLatestPitch({ pitch: 0, note: "--", confidence: 0 });

    try {
      const res = await engineRef.current.stop();
      setDiagnosis(res);
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (err) {
      setError("解析に失敗しました。");
    } finally {
      setIsRunning(false); 
      setIsAnalyzing(false);
    }
  }, [isRunning, isAnalyzing]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop().catch(() => {});
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return {
    isRunning, isPreparing, isAnalyzing, isCountingDown, countdown,
    pitch: latestPitch?.pitch ?? 0,
    note: latestPitch?.note ?? "--",
    confidence: latestPitch?.confidence ?? 0,
    diagnosis, error, start, stop,
  };
}