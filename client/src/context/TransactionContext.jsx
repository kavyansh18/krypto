import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const getEthereumContract = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const transactionContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      return transactionContract;
    } catch (error) {
      console.error("Failed to create a Web3 provider or contract:", error);
      return null;
    }
  } else {
    console.error("Ethereum object is not found. Make sure you have MetaMask installed.");
    return null;
  }
};

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  const sendTransaction = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
  
      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContract();
      if (!transactionContract) return;
  
      // Divide amount by 1000 before sending
      const amountInEther = parseFloat(amount) / 1000;
      const parsedAmount = ethers.parseEther(amountInEther.toString());
  
      // Convert BigNumber to a string for transaction value
      const amountHex = parsedAmount.toString(); // Use toString() instead of toHexString()
  
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: addressTo,
            from: currentAccount,
            gas: "0x5208", // 21000 GWEI
            value: amountHex,
          },
        ],
      });
  
      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );
  
      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Success - ${transactionHash.hash}`);
  
      const transactionCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionCount.toNumber());
      localStorage.setItem("transactionCount", transactionCount.toNumber());
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };
  

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        formData,
        setFormData,
        handleChange,
        sendTransaction,
        isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};