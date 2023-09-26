import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuildMenuItem } from '../components/GuildMenuItem';
import { GuildContext } from '../utils/contexts/GuildContext';
import { mockGuilds } from "../__mocks__/guilds"
import { Container, Page } from '../utils/styles';

export const MenuPage = () => {
    const navigate = useNavigate();
    const { updateGuildId } = useContext(GuildContext);
    
    const handleClick = (guildId: string) => {
        updateGuildId(guildId);
        navigate('/traaaabot/dashboard/categories'); 
    };
    
    return (
        <Page>
            <Container>
                <h2>Choose Server</h2>
                <div>
                    {mockGuilds.map((guild) => (
                        <div onClick={() => handleClick(guild.id)}>
                            <GuildMenuItem guild={guild} />
                        </div>
                    ))}
                </div>
                <p style={{ color: 'gray' }}>The servers you see listed here are based on whether you have the Administrator permission in the server.</p>
            </Container>
        </Page>
    );
};