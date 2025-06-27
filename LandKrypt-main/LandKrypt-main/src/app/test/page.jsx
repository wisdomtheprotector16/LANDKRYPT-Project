const VotingModal = ({ isOpen, onClose, availableTokens }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-white font-semibold text-xl mb-4">
          Eco-Friendly Development For Lekki Plot
        </h3>
        <p className="text-gray-300 mb-6">
          Vote on this land NFT earns you governance tokens (LKST) and a share of future returns.
        </p>
        
        <div className="mb-6">
          <h4 className="text-white font-medium mb-2">Stake Amount (LKST)</h4>
          <input
            type="number"
            placeholder="Enter amount to stake"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <p className="text-gray-400 text-sm mt-1">Available: {availableTokens} LKST</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle vote submission
              onClose();
            }}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition"
          >
            Vote Now
          </button>
        </div>
      </div>
    </div>
  );
};


export default VotingModal