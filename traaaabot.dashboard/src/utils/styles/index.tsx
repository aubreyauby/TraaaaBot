import styled from 'styled-components';
import TraaaaBotLogo from '../../traaaabot-icon.png';
import { css } from 'styled-components';

export const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
`;

export const MainButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 300px;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 4px 20px;
  box-sizing: border-box;
  border-radius: 5px;
  border: 1px solid #ffffff6d;
  margin: 15px 0;
`;

export const TextButton = styled(MainButton)`
  padding: 18px 28px;
  width: 90%;
  background-color: #272727;
  margin: 10px 0;
`;

export const HomePageStyle = styled.div`
  height: 100%;
  padding: 20px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;

export const TraaaaBotIcon = styled.div`
  width: 110px;
  height: 110px;
  position: sticky;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-image: url(${TraaaaBotLogo});
  background-size: cover;
  background-repeat: no-repeat;
`;

export const DarkOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1;
`;

export const VideoContainer = styled.div`
  position: relative;
  z-index: -1;
`;

export const GuildMenuItemStyle = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 20px;
    background-color: #252525;
    border-radius: 5px;
    border: 1px solid #ffffff14;
    margin: 8px 0;
`;

export const Container = styled.div`
    width: 1200px;
    margin: 0 auto;
`;

export const AppBarStyle = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 35px;
  box-sizing: border-box;
  border-bottom: 1px solid #c9c9c921;
`;

export const Title = styled.p`
  font-size: 22px;
`;

type FlexProps = Partial<{
  alignItems: string,
  justifyContent: string,
  flexDirection: string,
}>

export const Flex = styled.div<FlexProps>`
  display: flex;
  align-items: ${({ alignItems }) => alignItems};
  justify-content: ${({ justifyContent }) => justifyContent};
  flex-direction: ${({ flexDirection }) => flexDirection };
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  column-gap: 10px;
`;

export const InputField = styled.input`
  padding: 14px 16px;
  box-sizing: border-box;
  font-size: 16px;
  color: #fff;
  font-family: 'Roboto', sans-serif;
  background-color: #272727;
  border-radius: 5px;
  border: 1px solid #3f3f3f;
  outline: none;
  width: 100%;
  :focus {
    outline: 1px solid #ffffff5a;
  }
`;

export const TextArea = styled.textarea`
  madding: 14px 16px;
  box-sizing: border-box;
  font-size: 16px;
  color: #fff;
  font-family: 'Roboto';
  background-color: #272727;
  border-radius: 5px;
  border: 1px solid #3f3f3f;
  outline: none;
  width: 100%;
  resize: none;
  :focus {
    outline: 1px solid #ffffff5a;
  }
`;

type ButtonProps = {
  variant: 'primary' | 'secondary';
};

export const Button = styled.button<ButtonProps>`
  padding: 10px 20px;
  border-radius: 5px;
  outline: none;
  border: none;
  font-size: 16px;
  color: #fff;
  font-family: 'Roboto', sans-serif;
  cursor: pointer;
  ${({ variant }) => variant === 'primary' && css`
    background-color: #006ed3;
  `}
  ${({ variant }) => variant === 'secondary' && css`
    background-color: #3d3d3d;
  `}
`;

export const Page = styled.div`
  padding: 35px;
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px;
  font-family: 'Roboto';
  font-size: 18px;
  background-color: inherit;
  padding; 12px 16px;
  color: #fff;
  border: 1px solid #3f3f3f;
  border-radius: 5px;
  & > option {
    background-color: #191919;
  }
`;
