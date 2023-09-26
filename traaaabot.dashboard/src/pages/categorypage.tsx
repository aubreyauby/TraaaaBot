import { useContext } from "react"
import { GuildContext } from "../utils/contexts/GuildContext"
import { Container, Flex, Grid, Page, TextButton, Title } from '../utils/styles';
import { 
    IoSettingsOutline, 
    IoShieldCheckmarkOutline, 
    IoDiceOutline, 
    IoTicketOutline, 
    IoCheckmarkCircleOutline,
    IoFlameOutline,
    IoEyeOutline,
    IoDocumentTextOutline,
    IoPricetagOutline,
    IoLeafOutline,
    IoTerminalOutline,
    IoStarOutline,
    IoMusicalNoteOutline,
 } from 'react-icons/io5'
import { useNavigate } from "react-router-dom";

export const CategoryPage = () => {
    const { guildId } = useContext(GuildContext);
    const navigate = useNavigate();

    document.title = 'Settings () - TraaaaBot Dashboard - GXX: by electrasys';
    return (
        <Page>
            <Container>
                <div>
                    <div>
                        <Flex alignItems="center" justifyContent="space-between">
                            <Title>General</Title>
                            <IoSettingsOutline size={40} />
                        </Flex>
                        <p style={{ color: 'gray', textAlign: 'left', marginTop: '0px', userSelect: 'none' }}>Basic settings to configure TraaaaBot with.</p>
                        <Grid>
                            <TextButton onClick={() => navigate('/traaaabot/dashboard/prefix')}>
                                <IoPricetagOutline size={24} style={{ marginRight: '10px' }} /> Prefix
                            </TextButton>
                            <TextButton onClick={() => navigate('/traaaabot/dashboard/message')}>
                                <IoLeafOutline size={24} style={{ marginRight: '10px' }} /> Welcome Message
                            </TextButton>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoTerminalOutline size={24} style={{ marginRight: '10px' }} /> Custom Commands
                            </TextButton>
                        </Grid>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid #ffffff1b', marginTop: '20px'}}>
                    <div>
                        <Flex alignItems="center" justifyContent="space-between">
                            <Title>Safety and Moderation</Title>
                            <IoShieldCheckmarkOutline size={40}/>
                        </Flex>
                        <p style={{ color: 'gray', textAlign: 'left', marginTop: '0px', userSelect: 'none' }}>Critical features ideal for moderation and server management.</p>
                        <Grid>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoDocumentTextOutline size={24} style={{ marginRight: '10px' }} /> Moderation Logs
                            </TextButton>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoEyeOutline size={24} style={{ marginRight: '10px' }} /> Lookouts
                            </TextButton>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoFlameOutline size={24} style={{ marginRight: '10px' }} /> Strikes
                            </TextButton>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoCheckmarkCircleOutline size={24} style={{ marginRight: '10px' }} /> Verification
                            </TextButton>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoTicketOutline size={24} style={{ marginRight: '10px' }} /> Ticket System
                            </TextButton>
                        </Grid>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid #ffffff1b', marginTop: '20px'}}>
                    <div>
                        <Flex alignItems="center" justifyContent="space-between">
                            <Title>Fun and Games</Title>
                            <IoDiceOutline size={40}/>
                        </Flex>
                        <p style={{ color: 'gray', textAlign: 'left', marginTop: '0px', userSelect: 'none' }}>Boost activity in your server by bringing the fun TraaaaBot has to offer.</p>
                        <Grid>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoStarOutline size={24} style={{ marginRight: '10px' }} /> Starboard
                            </TextButton>
                            <TextButton style={{ display: 'flex', alignItems: 'center' }}>
                                <IoMusicalNoteOutline size={24} style={{ marginRight: '10px' }} /> TraaaaBot Music
                            </TextButton>
                        </Grid>
                    </div>
                </div>
            </Container>
        </Page>
    );
};