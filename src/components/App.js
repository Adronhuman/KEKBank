import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../contracts/Bank.json'
import React, { Component } from 'react';
import Token from '../contracts/KEKCoin.json'
import Web3 from 'web3';
import './App.css';

class App extends Component {

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum!=='undefined'){
      const web3 = new Web3(window.ethereum)
      const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()

      //load balance
      if(typeof accounts[0] !=='undefined'){
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({account: accounts[0], balance: balance, web3: web3})
      } else {
        window.alert('Please login with MetaMask')
      }

    } else {
      window.alert('Please install MetaMask')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      balance: 0,
      BankAddress: null
    }
  }

  render() {
    return (
      <div className='text-monospace'/>
    );
  }
}

export default App;
