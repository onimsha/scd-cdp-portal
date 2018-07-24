// Libraries
import React from "react";

class Footer extends React.Component {
  render() {
    return (
      <React.Fragment>
        <div className="landing-footer">
          <div className="logo-block">
            <div className="line" />
            <div className="logo-center"><img src="../img/maker-logo-footer.svg" alt="Maker" />&copy; DAI Foundation 2018</div>
          </div>
          <p>
            The DAI Stablecoin System was developed by <a href="https://www.makerdao.com">Maker</a>.<br />
            Our team consists of developers, economists and designers from all over the world. Our decentralized autonomous organization is governed by our token holders.
          </p>
          <ul>
            <li><a href="">FAQ</a></li>
            <li><a href="https://www.reddit.com/r/MakerDAO/">Reddit</a></li>
            <li><a href="https://chat.makerdao.com">Chat</a></li>
          </ul>
        </div>
      </React.Fragment>
    )
  }
}

export default Footer;