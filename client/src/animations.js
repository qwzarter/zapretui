export const customAnimations = `
@keyframes pulse-slow {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.5; }
}

@keyframes blob-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

@keyframes blob-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 60px) scale(0.95); }
  66% { transform: translate(50px, -30px) scale(1.05); }
}

@keyframes blob-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, 40px) scale(1.03); }
  66% { transform: translate(-60px, -10px) scale(0.98); }
}

.animate-pulse-slow {
  animation: pulse-slow 8s infinite ease-in-out;
}

.animate-blob-1 {
  animation: blob-1 12s infinite ease-in-out;
}

.animate-blob-2 {
  animation: blob-2 14s infinite ease-in-out reverse;
}

.animate-blob-3 {
  animation: blob-3 10s infinite ease-in-out;
}

/* Стили для кастомного скроллбара */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px; /* Ширина скроллбара */
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 0;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 0;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(107, 114, 128);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(75, 85, 99);
}

@keyframes pulsing-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(199, 210, 254, 0.7);
    opacity: 0.8;
  }
  50% {
    box-shadow: 0 0 25px 15px rgba(199, 210, 254, 0);
    opacity: 0.6;
  }
  100% {
    box-shadow: 0 0 0 0 rgba(199, 210, 254, 0.7);
    opacity: 0.8;
  }
}

.animate-pulsing-glow {
  animation: pulsing-glow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
`;