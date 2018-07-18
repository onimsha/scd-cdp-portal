import React from "react";
import {inject, observer} from "mobx-react";

import {printNumber, toBigNumber, toWei} from "../utils/helpers";

class LegacyCups extends React.Component {
  render() {
    return (
      Object.keys(this.props.system.tub.legacyCups).length > 0 &&
      <div className="migrate-cups-section">
        <header className="col">
          <h1 className="typo-h1 inline-headline">Migrate CDPs</h1>
        </header>
        <div className="number-of-cdps-to-migrate">Your account has <b>{ Object.keys(this.props.system.tub.legacyCups).length }</b> existing { 'CDP' + (Object.keys(this.props.system.tub.legacyCups).length > 1 ? 's' : '') } to be migrated.</div>
        {
          Object.keys(this.props.system.tub.legacyCups).map(key =>
            <div className="cup-to-migrate" key={ key }>
              <div className="cdp-id-heading">
                CDP ID #{ key }
              </div>
              <table>
                <thead>
                  <tr>
                    <th>DAI Debt</th>
                    <th>Locked PETH</th>
                    <th>% Ratio</th>
                    <th>Liquidation Price</th>
                    <th className="status-column">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{ printNumber(this.props.system.tab(this.props.system.tub.legacyCups[key])) }</td>
                    <td>{ printNumber(this.props.system.tub.legacyCups[key].ink) }</td>
                    <td>
                      {
                        this.props.system.tub.off === false
                          ? this.props.system.tub.legacyCups[key].art.gt(toBigNumber(0)) && this.props.system.tub.legacyCups[key].pro
                            ? <span>
                                { printNumber(toWei(this.props.system.tub.legacyCups[key].ratio).times(100)) }%
                              </span>
                            : "-"
                          : "-"
                      }
                    </td>
                    <td>
                      { this.props.system.tub.off === false && this.props.system.tub.legacyCups[key].liq_price && this.props.system.tub.legacyCups[key].liq_price.gt(0) ? printNumber(this.props.system.tub.legacyCups[key].liq_price) : "-" }
                    </td>
                    <td className="cdp-status">
                      {
                        this.props.system.tub.off === false
                        ?
                          this.props.system.tub.legacyCups[key].lad === "0x0000000000000000000000000000000000000000"
                          ?
                            "Closed"
                          :
                            this.props.system.tub.legacyCups[key].safe === "N/A" || this.props.system.pip.val.lt(0)
                            ?
                              "N/A"
                            :
                              this.props.system.tub.legacyCups[key].safe
                              ?
                                this.props.system.tub.legacyCups[key].art.eq(0) || this.props.system.tub.legacyCups[key].ratio.gte(2)
                                ?
                                <React.Fragment>
                                  <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="5" cy="5" fill="#1ABC9C" fillRule="evenodd" r="5"/>
                                  </svg>
                                  Safe
                                </React.Fragment>
                                :
                                  <React.Fragment>
                                    <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                                      <circle cx="5" cy="5" fill="#FBAE17" fillRule="evenodd" r="5"/>
                                    </svg>
                                    Risk
                                  </React.Fragment>
                              :
                                <React.Fragment>
                                  <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="5" cy="5" fill="#C0392B" fillRule="evenodd" r="5"/>
                                  </svg>
                                  Unsafe
                                </React.Fragment>
                        :
                          "-"
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="migrate-button">
                {
                  this.props.system.tub.cups[key]
                  ?
                    "CDP Migrated"
                  :
                    <button className="text-btn" data-method="migrate" data-cup={ key } disabled={ this.props.transactions.loading.migrate && this.props.transactions.loading.migrate[key] } onClick={ this.props.dialog.handleOpenDialog }>MIGRATE CDP #{ key }</button>
                }
              </div>
              <div className="clearfix"></div>
            </div>
          )
        }
        <div className="clearfix"></div>
        <button className="bright-style text-btn" style={ {display: 'block', margin: '4rem auto 0'} } onClick={ () => this.props.setOpenMigrate(false) }>RETURN TO DASHBOARD</button>
      </div>
    )
  }
}

export default inject("transactions")(inject("system")(inject("dialog")(observer(LegacyCups))));
