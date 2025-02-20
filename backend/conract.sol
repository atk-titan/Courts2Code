// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract JudicialDeposit {
    address public owner;
    mapping(address => bool) public authorizedContracts;

    // Transaction structure holds all details for a judicial transaction.
    struct Transaction {
        string caseID;
        string judgeId;
        string courtName;
        string party1;
        string party2;
        string from;         // Sender identifier
        string to;           // Receiver identifier
        uint256 amount;
        string contentId;
        bool transactionType; // true: money transfer, false: content adding
        uint256 date;
        uint256 timestamp;
    }

    // Mappings to store and organize transactions and case data.
    mapping(string => string[]) private caseParties;         // caseID => [party1, party2, judgeId]
    mapping(string => Transaction[]) private caseTransactions; // caseID => list of transactions
    mapping(string => string[]) private partyCases;            // partyID => list of caseIDs
    mapping(string => string[]) private judgeCases;            // judgeID => list of caseIDs
    mapping(uint256 => string[]) private dayTransactions;      // date => list of caseIDs
    mapping(string => string[]) private courtTransactions;     // courtName => list of caseIDs

    // Mapping: caseID to content IDs.
    mapping(string => string[]) private caseContentIds;        // caseID => list of content IDs

    // Event to log a transaction when it is added.
    event TransactionAdded(
        string caseID,
        string judgeId,
        string courtName,
        string party1,
        string party2,
        string from,
        string to,
        uint256 amount,
        string contentId,
        bool transactionType,
        uint256 date,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    // Only the owner can call functions with this modifier.
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // Modified onlyAuthorized modifier: now allows any caller.
    modifier onlyAuthorized() {
        _;
    }

    // Owner can add an address as an authorized contract.
    // (This functionality remains if you later want to restrict by role.)
    function authorizeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = true;
    }

    // Owner can revoke an address from being an authorized contract.
    function revokeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
    }

    /**
     * @notice Adds a new transaction.
     * @param _caseID The identifier of the case.
     * @param _judgeId The judge's identifier.
     * @param _courtName The name of the court.
     * @param _party1 The first party's identifier.
     * @param _party2 The second party's identifier.
     * @param _from The sender's identifier for money flow.
     * @param _to The receiver's identifier for money flow.
     * @param _amount The amount involved in the transaction.
     * @param _contentId A document hash or identifier related to the transaction.
     * @param _transactionType A Boolean indicating the type of transaction (true: money transfer, false: content adding).
     * @param _date A custom date (for grouping transactions by day).
     */
    function addTransaction(
        string memory _caseID,
        string memory _judgeId,
        string memory _courtName,
        string memory _party1,
        string memory _party2,
        string memory _from,
        string memory _to,
        uint256 _amount,
        string memory _contentId,
        bool _transactionType,
        uint256 _date
    ) external onlyAuthorized {
        // Create a new transaction record.
        Transaction memory newTransaction = Transaction({
            caseID: _caseID,
            judgeId: _judgeId,
            courtName: _courtName,
            party1: _party1,
            party2: _party2,
            from: _from,
            to: _to,
            amount: _amount,
            contentId: _contentId,
            transactionType: _transactionType,
            date: _date,
            timestamp: block.timestamp
        });

        // Append the new transaction to the list for the given case.
        caseTransactions[_caseID].push(newTransaction);

        // If no parties have been set for this case, initialize the associated parties.
        if (caseParties[_caseID].length == 0) {
            caseParties[_caseID] = [_party1, _party2, _judgeId];
        }

        // Update the mappings that track which cases a party or judge is involved in.
        partyCases[_party1].push(_caseID);
        partyCases[_party2].push(_caseID);
        judgeCases[_judgeId].push(_caseID);

        // Update day and court mappings.
        dayTransactions[_date].push(_caseID);
        courtTransactions[_courtName].push(_caseID);

        // If the transaction type indicates content adding (i.e. false), update the content mapping.
        if (!_transactionType) {
            caseContentIds[_caseID].push(_contentId);
        }

        // Emit an event logging the addition of this transaction.
        emit TransactionAdded(
            _caseID,
            _judgeId,
            _courtName,
            _party1,
            _party2,
            _from,
            _to,
            _amount,
            _contentId,
            _transactionType,
            _date,
            block.timestamp
        );
    }

    // Retrieves all transactions for a specific case (both money and content).
    function getTransactions(string memory _caseID) external view returns (Transaction[] memory) {
        return caseTransactions[_caseID];
    }

    // Retrieves only money transactions for a specific case.
    function getMoneyTransactions(string memory _caseID) external view returns (Transaction[] memory) {
        Transaction[] storage allTx = caseTransactions[_caseID];
        uint256 count = 0;
        for (uint256 i = 0; i < allTx.length; i++) {
            if (allTx[i].transactionType == true) { // money transaction
                count++;
            }
        }
        Transaction[] memory moneyTxs = new Transaction[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allTx.length; i++) {
            if (allTx[i].transactionType == true) {
                moneyTxs[index] = allTx[i];
                index++;
            }
        }
        return moneyTxs;
    }

    // Retrieves a specific money transaction by index from the filtered money transactions.
    function getMoneyTransactionByIndex(string memory _caseID, uint256 _moneyIndex) external view returns (Transaction memory) {
        Transaction[] storage allTx = caseTransactions[_caseID];
        uint256 count = 0;
        for (uint256 i = 0; i < allTx.length; i++) {
            if (allTx[i].transactionType == true) {
                if (count == _moneyIndex) {
                    return allTx[i];
                }
                count++;
            }
        }
        revert("Invalid money transaction index");
    }

    // Retrieves the list of parties associated with a given case.
    function getCaseParties(string memory _caseID) external view returns (string[] memory) {
        return caseParties[_caseID];
    }

    // Retrieves the number of transactions recorded for a specific case.
    function getTransactionCount(string memory _caseID) external view returns (uint256) {
        return caseTransactions[_caseID].length;
    }

    // Retrieves all case IDs in which a particular party is involved.
    function getCasesByParty(string memory _party) external view returns (string[] memory) {
        return partyCases[_party];
    }

    // Retrieves all case IDs associated with a specific judge.
    function getCasesByJudge(string memory _judgeId) external view returns (string[] memory) {
        return judgeCases[_judgeId];
    }

    // Retrieves all case IDs for transactions that occurred on a specific day.
    function getTransactionsByDay(uint256 _date) external view returns (string[] memory) {
        return dayTransactions[_date];
    }

    // Retrieves all case IDs for transactions associated with a particular court.
    function getTransactionsByCourt(string memory _courtName) external view returns (string[] memory) {
        return courtTransactions[_courtName];
    }

    // Retrieves all content IDs associated with a given case.
    function getContentIdsByCase(string memory _caseID) external view returns (string[] memory) {
        return caseContentIds[_caseID];
    }
}