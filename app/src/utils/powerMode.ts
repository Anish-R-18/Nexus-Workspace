export function spawnParticles(x: number, y: number, color: string = '#00f3ff') {
  const numParticles = 5 + Math.random() * 5;
  for (let i = 0; i < numParticles; i++) {
    createParticle(x, y, color);
  }
}

function createParticle(x: number, y: number, color: string) {
  const particle = document.createElement('div');
  
  const size = Math.random() * 4 + 2;
  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 60 + 20;
  const duration = Math.random() * 500 + 500;
  
  const tx = Math.cos(angle) * velocity;
  const ty = Math.sin(angle) * velocity - 20; 
  
  particle.style.position = 'fixed';
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.backgroundColor = color;
  particle.style.borderRadius = '50%';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '9999';
  particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
  
  particle.style.opacity = '1';
  particle.style.transform = 'translate(-50%, -50%) scale(1)';
  particle.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${duration}ms linear`;
  
  document.body.appendChild(particle);
  
  requestAnimationFrame(() => {
    particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
    particle.style.opacity = '0';
  });
  
  setTimeout(() => {
    particle.remove();
  }, duration);
}
