// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EchoAgentCore {
    struct Agent {
        string agentId;
        string metadataKey;
        string name;
        string tags;
        address payable paymentWallet;
        bool registered;
    }

    address public owner;
    uint256 public vipPrice = 0.02 ether;

    mapping(bytes32 => Agent) private agents;
    mapping(address => mapping(bytes32 => uint256)) private vipLevels;

    event AgentRegistered(
        string indexed agentId,
        string metadataKey,
        string name,
        address paymentWallet
    );
    event AgentTipped(address indexed user, string indexed agentId, uint256 amount);
    event VIPUnlocked(
        address indexed user,
        string indexed agentId,
        uint256 level,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRegistered(bytes32 agentKey) {
        require(agents[agentKey].registered, "Agent not registered");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerAgent(
        string calldata agentId,
        string calldata metadataKey,
        string calldata name,
        string calldata tags,
        address payable paymentWallet
    ) external onlyOwner {
        require(bytes(agentId).length > 0, "Missing agentId");
        require(paymentWallet != address(0), "Missing payment wallet");

        bytes32 agentKey = _agentKey(agentId);

        agents[agentKey] = Agent({
            agentId: agentId,
            metadataKey: metadataKey,
            name: name,
            tags: tags,
            paymentWallet: paymentWallet,
            registered: true
        });

        emit AgentRegistered(agentId, metadataKey, name, paymentWallet);
    }

    function tipAgent(string calldata agentId)
        external
        payable
        onlyRegistered(_agentKey(agentId))
    {
        require(msg.value > 0, "Tip required");

        Agent storage agent = agents[_agentKey(agentId)];
        agent.paymentWallet.transfer(msg.value);

        emit AgentTipped(msg.sender, agentId, msg.value);
    }

    function unlockVIP(string calldata agentId)
        external
        payable
        onlyRegistered(_agentKey(agentId))
    {
        require(msg.value >= vipPrice, "Insufficient VIP payment");

        bytes32 agentKey = _agentKey(agentId);
        Agent storage agent = agents[agentKey];
        vipLevels[msg.sender][agentKey] = 1;
        agent.paymentWallet.transfer(msg.value);

        emit VIPUnlocked(msg.sender, agentId, 1, msg.value);
    }

    function isVIP(address user, string calldata agentId) external view returns (bool) {
        return vipLevels[user][_agentKey(agentId)] > 0;
    }

    function getAgent(string calldata agentId) external view returns (Agent memory) {
        return agents[_agentKey(agentId)];
    }

    function setVipPrice(uint256 newVipPrice) external onlyOwner {
        vipPrice = newVipPrice;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Missing owner");
        owner = newOwner;
    }

    function _agentKey(string calldata agentId) private pure returns (bytes32) {
        return keccak256(bytes(agentId));
    }
}
