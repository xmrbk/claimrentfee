"use client";

import { Layout, Card, Typography, Menu } from 'antd';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Claim from "./components/Claim"; // Import thành phần Claim

const { Title } = Typography;

export default function Home() {
  return (
    <Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center', display: 'flex', backgroundColor: '#f0f2f5', padding: '20px' }}>
      <Card
        style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center',
          borderRadius: '5px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          padding: '10px',
        }}
        bordered={false}
        hoverable
      >
        {/* Thanh Menu */}
        <Menu
          mode="horizontal"
          style={{
            marginBottom: '20px',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Menu.Item key="1" style={{ fontSize: '1rem', fontWeight: 'bold', padding: '10px 20px' }}>
            <a href="https://quagmire.best/createtoken" style={{ color: '#1890ff', transition: 'color 0.3s' }}>
              Solana Token Creation
            </a>
          </Menu.Item>
          <Menu.Item key="2" style={{ fontSize: '1rem', fontWeight: 'bold', padding: '10px 20px' }}>
            <a href="https://quagmire.best/createandsnipelp" style={{ color: '#1890ff', transition: 'color 0.3s' }}>
              Create And Snipe Raydium LP at Block-0
            </a>
          </Menu.Item>
        </Menu>

        <Title level={2}>💯 Close SPL Token Accounts 💯</Title>
        <Title level={4}>Solana Blockchain keeps your SOL!</Title>
        <Title level={4}>YOU CAN GET IT BACK!</Title>
        <WalletMultiButton style={{ marginBottom: '20px', width: '100%' }} />
        {/* Gọi thành phần Claim */}
        <Claim  />
      </Card>
    </Layout>
  );
}
