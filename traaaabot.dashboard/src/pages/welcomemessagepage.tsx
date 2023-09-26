import { Container, Flex, Page, Select, TextArea, Title, Button } from "../utils/styles";

export const WelcomeMessagePage = () => (
    <Page>
        <Container>
            <Title>Member Welcoming</Title>
            <div>
                <section>
                    <div>
                        <label>Set Welcome Channel</label>
                    </div>
                    <Select style={{ margin: '10px 0' }}>
                        <option disabled>Select a Channel...</option>
                        <option>123</option>
                        <option>123</option>
                        <option>123sel</option>
                    </Select>
                </section>
                <section style={{ margin: '10px 0' }}>
                    <div>
                        <label htmlFor="message">Current Message</label>
                    </div>
                    <TextArea style={{ marginTop: '10px' }} id="message" />
                </section>
                <Flex justifyContent="flex-end">
                    <Button variant="secondary" style={{marginRight: '8px'}}>Reset</Button>
                    <Button variant="primary">Save</Button>
                </Flex>
                <p style={{ color: 'gray', marginTop: '20px' }}>Customize the welcome message sent to users who join the server.</p>
                <p style={{ color: 'gray', marginTop: '20px' }}>
                If you want to ping the new member, use <code>@member</code>. If you want to reference the member without pinging them, use <code>&member</code> instead. You can also surround it with the usual message formatting like **bold**, *italics*, __underline__, etc. There is an enforced character limit as Discord also applies their character limit rules to bots as well.
                </p>
                <p style={{ color: 'yellow', marginTop: '20px' }}>⚠️ If you can't see the channel in the dropdown menu, TraaaaBot might be missing View Channel permissions for the channel you're trying to set it as. Please enable the View Channels permission globally on the TraaaaBot role or set the permissions individually in the channels usually restricted to members without a role.</p>

            </div>
        </Container>
    </Page>
);