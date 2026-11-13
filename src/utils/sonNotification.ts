let contexteAudio: AudioContext | null = null;

export function preparerSonNotification() {
  if (typeof window.AudioContext === "undefined") return;
  contexteAudio ??= new window.AudioContext();
  if (contexteAudio.state === "suspended") {
    void contexteAudio.resume().catch((erreur: unknown) => {
      console.error("Impossible d’activer le son des notifications.", erreur);
    });
  }
}

export function emettreSonNotification() {
  if (!contexteAudio || contexteAudio.state !== "running") return;
  const debut = contexteAudio.currentTime;
  const oscillateur = contexteAudio.createOscillator();
  const volume = contexteAudio.createGain();
  oscillateur.type = "sine";
  oscillateur.frequency.setValueAtTime(880, debut);
  volume.gain.setValueAtTime(0.0001, debut);
  volume.gain.exponentialRampToValueAtTime(0.12, debut + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, debut + 0.16);
  oscillateur.connect(volume);
  volume.connect(contexteAudio.destination);
  oscillateur.onended = () => {
    oscillateur.disconnect();
    volume.disconnect();
  };
  oscillateur.start(debut);
  oscillateur.stop(debut + 0.17);
}
