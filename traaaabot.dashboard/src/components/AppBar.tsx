import { AppBarStyle } from "../utils/styles"
import tbLogo from "../traaaabot-icon-transparent.png"

export const AppBar = () => {
    return <AppBarStyle>
        <img
            src={tbLogo}
            height={35}
            width={35}
            style={{ borderRadius: '50%' }}
            alt="logo above"
        />
        <h1 style={{ fontWeight: 'normal', fontSize: '20px' }}>Configuring</h1>
        <img src="" 
        height={55} 
        width={55} 
        style={{
            borderRadius: '50%'
        }} 
        alt="logo"
        />
    </AppBarStyle>
}