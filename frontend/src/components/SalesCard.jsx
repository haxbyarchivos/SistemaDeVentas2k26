import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const SalesCard = ({ title, value, percent, icon, fillPercent = 76 }) => {
  const [displayValue, setDisplayValue] = useState('$0');

  useEffect(() => {
    // Extraer solo dígitos del string (ej: "$12.500" -> "12500")
    const cleanValue = value.replace(/\D/g, '');
    const numericValue = parseInt(cleanValue, 10) || 0;
    
    if (numericValue === 0) {
      setDisplayValue('$0');
      return;
    }
    
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(numericValue * easeProgress);
      
      const formatted = new Intl.NumberFormat('es-AR', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      }).format(current);
      
      setDisplayValue(`$${formatted}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const finalFormatted = new Intl.NumberFormat('es-AR', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 0 
        }).format(numericValue);
        setDisplayValue(`$${finalFormatted}`);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <StyledWrapper fillPercent={fillPercent}>
      <div className="card">
        <div className="title">
          <span>
            {icon || (
              <svg width={20} fill="currentColor" height={20} viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                <path d="M1362 1185q0 153-99.5 263.5t-258.5 136.5v175q0 14-9 23t-23 9h-135q-13 0-22.5-9.5t-9.5-22.5v-175q-66-9-127.5-31t-101.5-44.5-74-48-46.5-37.5-17.5-18q-17-21-2-41l103-135q7-10 23-12 15-2 24 9l2 2q113 99 243 125 37 8 74 8 81 0 142.5-43t61.5-122q0-28-15-53t-33.5-42-58.5-37.5-66-32-80-32.5q-39-16-61.5-25t-61.5-26.5-62.5-31-56.5-35.5-53.5-42.5-43.5-49-35.5-58-21-66.5-8.5-78q0-138 98-242t255-134v-180q0-13 9.5-22.5t22.5-9.5h135q14 0 23 9t9 23v176q57 6 110.5 23t87 33.5 63.5 37.5 39 29 15 14q17 18 5 38l-81 146q-8 15-23 16-14 3-27-7-3-3-14.5-12t-39-26.5-58.5-32-74.5-26-85.5-11.5q-95 0-155 43t-60 111q0 26 8.5 48t29.5 41.5 39.5 33 56 31 60.5 27 70 27.5q53 20 81 31.5t76 35 75.5 42.5 62 50 53 63.5 31.5 76.5 13 94z" />
              </svg>
            )}
          </span>
          <p className="title-text">
            {title || 'Sales'}
          </p>
          <p className="percent">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" fill="currentColor" height={20} width={20}>
              <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z" />
            </svg> {percent || '20%'}
          </p>
        </div>
        <div className="data">
          <p>
            {displayValue}
          </p>
          <div className="range">
            <div className="fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    padding: 1.5rem;
    background: linear-gradient(180deg, #1a1a1a, #0f0f0f);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    width: 340px;
    min-height: 180px;
    border-radius: 28px;
    border: 1px solid #2a2a2a;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
      "Helvetica Neue", Arial, sans-serif;
    transform: translateY(20px);
    opacity: 0;
    animation: cardFadeUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    display: flex;
    flex-direction: column;
  }

  .card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6);
    transition:
      transform 0.45s ease,
      box-shadow 0.45s ease;
  }

  .title {
    display: flex;
    align-items: center;
  }

  .title span {
    position: relative;
    padding: 0.6rem;
    background: linear-gradient(135deg, #34d399, #10b981);
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    box-shadow: 0 3px 8px rgba(16, 185, 129, 0.35);
    animation: pulse 2.4s ease-in-out infinite;
  }

  .title span svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ffffff;
    height: 1rem;
  }

  .title-text {
    margin-left: 0.75rem;
    color: #e5e5e5;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .percent {
    margin-left: 0.5rem;
    color: #34d399;
    font-weight: 600;
    display: flex;
    font-size: 15px;
  }

  .data {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .data p {
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
    color: #ffffff;
    font-size: 2.4rem;
    line-height: 2.7rem;
    font-weight: 700;
    text-align: left;
    letter-spacing: -0.03em;
    opacity: 0;
    animation: fadeIn 0.8s ease forwards 0.3s;
  }

  .data .range {
    position: relative;
    background-color: #2a2a2a;
    width: 100%;
    height: 0.55rem;
    border-radius: 9999px;
    overflow: hidden;
  }

  .data .range .fill {
    position: absolute;
    top: 0;
    left: 0;
    background: linear-gradient(90deg, #34d399, #10b981);
    width: 0%;
    height: 100%;
    border-radius: inherit;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
    animation:
      fillBar 1.6s ease forwards 0.5s,
      pulseFill 4s ease-in-out infinite 2.2s;
  }

  /* ✨ Animations */
  @keyframes cardFadeUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fillBar {
    from {
      width: 0%;
    }
    to {
      width: ${props => props.fillPercent || 76}%;
    }
  }

  @keyframes pulseFill {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.2);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 3px 8px rgba(16, 185, 129, 0.35);
    }
    50% {
      transform: scale(1.08);
      box-shadow: 0 6px 14px rgba(16, 185, 129, 0.45);
    }
  }
`;

export default SalesCard;
