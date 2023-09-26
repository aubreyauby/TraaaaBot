import { Container, Title, InputField, Button, Flex, Page } from "../utils/styles";

export const GuildPrefixPage = () => (
    <Page>
        <Container style={{ width: '800px' }}>
            <Title>Command Prefix</Title>
            <div>
                <div>
                    <label htmlFor="prefix">Current Prefix</label>
                </div>
                <InputField style={{ margin: '10px 0px' }} id="prefix"/>
                <Flex justifyContent="flex-end">
                    <Button variant="secondary" type="button" style={{marginRight: '8px'}}>Reset</Button>
                    <Button variant="primary">Save</Button>
                </Flex>
                <p style={{ color: 'gray', marginTop: '20px' }}>Customize the textual prefix TraaaaBot will listen to in the server.</p>
                <p style={{ color: 'gray', marginTop: '20px' }}>TraaaaBot also has native support for Discord's new slash commands, so you don't need to run commands using these custom prefixes. However, some commands do require the use of the custom prefix, especially if you are using custom commands, and commands that are exclusive to servers with access.</p>
            </div>
        </Container>
    </Page>
);