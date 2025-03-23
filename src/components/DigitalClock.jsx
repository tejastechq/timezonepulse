import React, { useState, useEffect } from 'react';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerID = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerID);
  }, []);

  const formatTime = (num) => num.toString().padStart(2, '0');

  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: '2.5rem',
      backgroundColor: '#333',
      color: '#0f0',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(0,255,0,0.5)'
    }}>
      {formatTime(time.getHours())}:
      {formatTime(time.getMinutes())}:
      {formatTime(time.getSeconds())}
    </div>
  );
};

export default DigitalClock;
