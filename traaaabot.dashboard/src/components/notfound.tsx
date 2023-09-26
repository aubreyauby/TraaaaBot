import React, { useEffect, useRef, useState } from 'react';
import { FaDiscord, FaQuestion } from 'react-icons/fa';
import { HomePageStyle, MainButton, TraaaaBotIcon, BackgroundVideo, DarkOverlay, VideoContainer } from '../utils/styles';
import backgroundVideo from '../assets/dashboardbkg.mp4';
import blahajImage from '../assets/blahaj.png';

const NotFound: React.FC = () => {
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

      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1 style={{ fontSize: '72px' }}>That's a shame</h1>
        <p style={{marginTop: '-3%'}}>We looked everywhere for the page you requested, and it was nowhere to be found.</p>
        <img
          src={blahajImage}
          alt="blahaj says trans rights"
          style={{ width: '10%', marginTop: '3%' }}
        />
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

export default NotFound;