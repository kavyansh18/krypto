import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const getEthereumContract = async (useSigner = false) => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      if (useSigner) {
        const signer = await provider.getSigner();
        return new ethers.Contract(contractAddress, contractABI, signer);
      } else {
        return new ethers.Contract(contractAddress, contractABI, provider);
      }
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
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (window.ethereum) {
        const transactionContract = await getEthereumContract(false); // Use provider for reading data
        if (!transactionContract) return;

        const availableTransactions = await transactionContract.getAllTransactions();

        const structuredTransactions = availableTransactions.map((transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(), // Convert BigInt to Number
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseFloat(ethers.formatEther(transaction.amount)) // Convert BigInt to float
        }));

        setTransactions(structuredTransactions);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnect = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");

      const accounts = await window.ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfTransactionsExists = async () => {
    try {
      if (window.ethereum) {
        const transactionContract = await getEthereumContract(false); // Use provider for reading data
        if (!transactionContract) return;

        const transactionCount = await transactionContract.getTransactionCount();

        window.localStorage.setItem("transactionCount", transactionCount.toString());
        setTransactionCount(transactionCount.toString());
      }
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  const sendTransaction = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");

      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = await getEthereumContract(true); // Use signer for sending transactions
      if (!transactionContract) return;

      const parsedAmount = ethers.parseEther(amount);

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

      const updatedTransactionCount = await transactionContract.getTransactionCount();
      setTransactionCount(updatedTransactionCount.toNumber());
      localStorage.setItem("transactionCount", updatedTransactionCount.toString());

      window.reload()
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnect();
    checkIfTransactionsExists();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
