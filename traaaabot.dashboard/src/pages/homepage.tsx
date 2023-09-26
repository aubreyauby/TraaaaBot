import React, { useEffect, useRef, useState } from 'react';
import { FaDiscord, FaQuestion } from 'react-icons/fa';
import { HomePageStyle, MainButton, TraaaaBotIcon, BackgroundVideo, DarkOverlay, VideoContainer } from '../utils/styles';
import backgroundVideo from '../assets/dashboardbkg.mp4';

export const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Initialize with the current year

  useEffect(() => {
    const playVideo = () => {
      if (videoRef.current) {
        videoRef.current.play().catch((error: any) => {
          console.error('Video playback error:', error);
        });
      }
    };

    playVideo();

    document.title = 'TraaaaBot Dashboard - GXX: by electrasys';

    const interval = setInterval(() => {
      const now = new Date();
      // Adjust the timezone offset as needed
      const easternTimeOffset = -5 * 60 * 60 * 1000;
      const etNow = new Date(now.getTime() + easternTimeOffset);
      setCurrentYear(etNow.getFullYear());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <HomePageStyle>
      <VideoContainer>
        <BackgroundVideo autoPlay loop muted ref={videoRef}>
          <source src={backgroundVideo} type="video/mp4" />
        </BackgroundVideo>
        <DarkOverlay />
      </VideoContainer>

      <div>
        <TraaaaBotIcon />
        <MainButton>
          <FaDiscord size={30} color="5865F2" style={{ marginRight: '10px' }} />
          <p style={{ fontSize: '18px' }}>Sign in with Discord</p>
        </MainButton>
        <MainButton>
          <FaQuestion size={30} color="FFFFFF" style={{ marginRight: '10px' }} />
          <p style={{ fontSize: '18px' }}>Documentation</p>
        </MainButton>
      </div>
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: '350px', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Get Help</span>
        </div>
        <div style={{ color: '#888888', fontSize: '14px' }}>
          &copy; {`${currentYear}: GXX: by electrasys`}
        </div>
      </div>
    </HomePageStyle>
  );
};
