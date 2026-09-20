import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Utensils, MapPin, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, Sparkles, Truck, Clock, RefreshCw, Plus, Trash2, Building2, Phone, X } from 'lucide-react';
import { api } from '../services/api';
import { Toast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';
import { ImpactMetrics } from '../components/ImpactMetrics';
import { Timeline } from '../components/Timeline';

export const FoodBridgeMatching = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  // Selected donors for matching (supports multi-donor partial match combination)
  const [selectedDonorIds, setSelectedDonorIds] = useState([]);
  const [modalDonor, setModalDonor] = useState(null);

  // Add Real Food Source Modal state
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false);
  const [submittingDonor, setSubmittingDonor] = useState(false);
  const [newDonor, setNewDonor] = useState({
    name: '',
    facilityType: 'COMMUNITY_KITCHEN',
    foodType: '',
    availableQuantity: 100,
    location: '',
    city: 'Chennai',
    prepTime: 'Freshly prepared 30 mins ago',
    contactPerson: '',
    contactPhone: ''
  });

  // Simulation controls
  const [simulateNoFood, setSimulateNoFood] = useState(false);

  // Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Load request and donors
  const fetchData = async () => {
    setLoading(true);
    try {
      if (requestId) {
        const reqRes = await api.getResourceRequestById(requestId);
        setRequest(reqRes.data);
      }

      const donorsRes = await api.getFoodDonors({ simulateEmpty: simulateNoFood ? 'true' : 'false' });
      setDonors(donorsRes.data || []);
    } catch (err) {
      console.error('[FoodBridge] Error loading data:', err);
      addToast('error', 'Load Failed', err.message || 'Unable to load FoodBridge donors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [requestId, simulateNoFood]);

  const foodItem = request?.resources?.find(r => r.type === 'food');
  const requestedMeals = foodItem ? foodItem.quantity : 95;
  const recipientArea = request?.location?.area || 'ABC Relief Shelter';
  const recipientCity = request?.location?.city || 'Chennai';
  const isAlreadyMatched = request?.foodBridgeMatch?.matched;

  // Calculate combined selected meals
  const selectedDonorsList = donors.filter(d => selectedDonorIds.includes(d.donorId));
  const combinedSelectedMeals = selectedDonorsList.reduce((acc, d) => acc + d.availableQuantity, 0);
  const mealsDifference = requestedMeals - combinedSelectedMeals;

  const toggleDonorSelection = (donor) => {
    if (selectedDonorIds.includes(donor.donorId)) {
      setSelectedDonorIds(selectedDonorIds.filter(id => id !== donor.donorId));
    } else {
      setSelectedDonorIds([...selectedDonorIds, donor.donorId]);
    }
  };

  // Open single donor match modal
  const handleOpenMatchModal = (donor) => {
    setModalDonor(donor);
  };

  // Confirm Single Donor Match
  const handleConfirmSingleMatch = async () => {
    if (!modalDonor) return;
    setMatchingInProgress(true);

    try {
      const res = await api.matchFoodDonors(requestId || request?.requestId || 'RR-1001', [modalDonor.donorId]);
      setRequest(res.data);
      setModalDonor(null);
      addToast('success', 'Food Rescue Matched', `Successfully matched ${res.data.foodBridgeMatch.matchedQuantity} meals from ${modalDonor.name}!`);
    } catch (err) {
      console.error('[FoodBridge] Match error:', err);
      addToast('error', 'Match Failed', err.message || 'Could not complete food match.');
    } finally {
      setMatchingInProgress(false);
    }
  };

  // Confirm Combined Multi-Donor Match (Partial combination)
  const handleConfirmCombinedMatch = async () => {
    if (selectedDonorIds.length === 0) return;
    setMatchingInProgress(true);

    try {
      const res = await api.matchFoodDonors(requestId || request?.requestId || 'RR-1001', selectedDonorIds);
      setRequest(res.data);
      addToast('success', 'Combined Match Confirmed', `Successfully combined ${selectedDonorIds.length} food sources to cover requested meals!`);
    } catch (err) {
      console.error('[FoodBridge] Multi match error:', err);
      addToast('error', 'Match Failed', err.message || 'Could not complete combined food match.');
    } finally {
      setMatchingInProgress(false);
    }
  };

  // Register real food surplus donor to database
  const handleCreateDonor = async (e) => {
    e.preventDefault();
    if (!newDonor.name.trim() || !newDonor.foodType.trim() || !newDonor.location.trim()) {
      addToast('error', 'Validation Error', 'Facility name, food item description, and location area are required.');
      return;
    }

    setSubmittingDonor(true);
    try {
      const res = await api.createFoodDonor({
        name: newDonor.name,
        facilityType: newDonor.facilityType,
        foodType: newDonor.foodType,
        availableQuantity: parseInt(newDonor.availableQuantity, 10) || 50,
        location: newDonor.location,
        city: newDonor.city || 'Chennai',
        prepTime: newDonor.prepTime || 'Freshly prepared',
        contactPerson: newDonor.contactPerson || 'Food Coordinator',
        contactPhone: newDonor.contactPhone || '+91 98400 00000'
      });

      addToast('success', 'Food Source Registered', `"${res.data.name}" added to FoodBridge with ${res.data.availableQuantity} meals!`);
      setIsAddDonorModalOpen(false);
      setNewDonor({
        name: '',
        facilityType: 'COMMUNITY_KITCHEN',
        foodType: '',
        availableQuantity: 100,
        location: '',
        city: 'Chennai',
        prepTime: 'Freshly prepared 30 mins ago',
        contactPerson: '',
        contactPhone: ''
      });
      await fetchData();
    } catch (err) {
      console.error('[FoodBridge] Add donor failed:', err);
      addToast('error', 'Registration Failed', err.message || 'Could not register food source.');
    } finally {
      setSubmittingDonor(false);
    }
  };

  // Remove a donor
  const handleDeleteDonor = async (donorId, donorName) => {
    try {
      await api.deleteFoodDonor(donorId);
      addToast('info', 'Food Source Removed', `Removed "${donorName}" from active network.`);
      await fetchData();
    } catch (err) {
      console.error('[FoodBridge] Delete donor failed:', err);
      addToast('error', 'Delete Failed', err.message || 'Could not remove food source.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin text-yellow-400" />
        <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Searching FoodBridge surplus donors...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Navigation & Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate(request ? `/requests/${request.requestId}` : '/requests')}
          style={{ marginBottom: '1rem', padding: '0.4rem 0.875rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Request Details</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-yellow">
                🍱 FOODBRIDGE MATCHING
              </span>
              <span className="badge badge-green">
                <span className="status-dot status-dot-green" />
                SURPLUS RESCUE ENGINE
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Available Food Sources
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              Near {recipientArea}, {recipientCity} • Target: <strong style={{ color: '#facc15' }}>{requestedMeals} meals</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-green"
              onClick={() => setIsAddDonorModalOpen(true)}
              style={{ fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>Register Surplus Food</span>
            </button>

            {/* Demo toggle for 0 food state */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.875rem',
              backgroundColor: '#0f172a',
              borderRadius: 8,
              border: '1px solid #1e293b'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SCENARIO:</span>
              <button
                className={`btn ${simulateNoFood ? 'btn-yellow' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                onClick={() => setSimulateNoFood(!simulateNoFood)}
              >
                {simulateNoFood ? 'Reset Sources' : 'Simulate 0 Food Sources'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* If already matched, show Confirmed Rescue Status & Impact */}
      {isAlreadyMatched ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{
            border: '2px solid rgba(16, 185, 129, 0.5)',
            backgroundColor: 'rgba(16, 185, 129, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                    🍱 FOOD RESCUE MATCHED
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                    Request {request.requestId}
                  </div>
                </div>
              </div>

              <StatusBadge type="status" value={request.foodBridgeMatch.status || 'MATCHED'} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: '#090d16',
              padding: '1.25rem',
              borderRadius: 8,
              border: '1px solid #1e293b'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DONOR SOURCE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>
                  {request.foodBridgeMatch.matches.map(m => m.donorName).join(', ')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>RECIPIENT SHELTER</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>
                  {recipientArea}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ALLOCATED MEALS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#facc15', marginTop: '0.2rem' }}>
                  {request.foodBridgeMatch.matchedQuantity} meals
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DISPATCH STATUS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                  🟢 MATCHED & READY
                </div>
              </div>
            </div>

            {/* Verified Impact Metrics */}
            <ImpactMetrics
              mealsRescued={request.foodBridgeMatch.matchedQuantity}
              peopleSupported={request.peopleCount || 120}
              foodDiverted={request.foodBridgeMatch.matchedQuantity}
            />

            {/* Live Progress Timeline */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} className="text-yellow-400" />
                <span>Food Rescue Operations Timeline</span>
              </div>
              <Timeline events={request.timeline} />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/requests/${request.requestId}`)}
              >
                View Complete Request File
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Donors Matching View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Request Quick Summary Bar */}
          <div className="card" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#0f172a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>REQUEST ID</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#facc15' }}>
                  {request?.requestId || 'DEMO-REQUEST'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FOOD REQUIRED</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  {requestedMeals} meals
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PEOPLE SUPPORTED</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  {request?.peopleCount || 120} people
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-green">
                <span className="status-dot status-dot-green" />
                ACTIVE FOOD SOURCES ({donors.length})
              </span>
              <span className="badge badge-yellow">
                COMMUNITY RESCUE NETWORK
              </span>
            </div>
          </div>

          {/* Multi-Donor Combination Bar (if donors selected) */}
          {selectedDonorIds.length > 0 && (
            <div className="card" style={{
              border: '2px solid rgba(250, 204, 21, 0.4)',
              backgroundColor: 'rgba(250, 204, 21, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {combinedSelectedMeals >= requestedMeals ? (
                      <span className="badge badge-green">🟢 FULL FOOD MATCH</span>
                    ) : (
                      <span className="badge badge-yellow">🟡 PARTIAL MATCH</span>
                    )}
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      {selectedDonorIds.length} Donor(s) Selected: {combinedSelectedMeals} Meals Total
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                    {combinedSelectedMeals >= requestedMeals
                      ? `${requestedMeals} of ${combinedSelectedMeals} available meals will be allocated.`
                      : `${combinedSelectedMeals} meals can be supplied. ${mealsDifference} meals are still required.`}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedDonorIds([])}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                  >
                    Clear Selection
                  </button>
                  <button
                    className="btn btn-green"
                    disabled={matchingInProgress}
                    onClick={handleConfirmCombinedMatch}
                  >
                    {matchingInProgress ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>CONFIRM COMBINED MATCH</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Donors List or Empty State */}
          {donors.length === 0 ? (
            /* NO FOOD AVAILABLE STATE (Required by section 13) */
            <div className="card" style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              border: '2px dashed #334155',
              backgroundColor: 'rgba(15, 23, 42, 0.5)'
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(250, 204, 21, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: '#facc15'
              }}>
                <Utensils size={32} />
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
                🍱 FOODBRIDGE
              </h2>
              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: 500, margin: '0 auto 1.5rem auto' }}>
                No suitable food surplus is currently available near this location.
              </p>

              <div style={{
                display: 'inline-flex',
                gap: '2rem',
                padding: '1rem 2rem',
                backgroundColor: '#090d16',
                borderRadius: 8,
                border: '1px solid #1e293b',
                marginBottom: '1.75rem',
                textAlign: 'left'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>REQUESTED</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                    {requestedMeals} meals
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>STILL REQUIRED</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>
                    {requestedMeals} meals
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SYSTEM STATUS</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#facc15', marginTop: '0.2rem' }}>
                    🟡 WAITING FOR FOOD SOURCE
                  </div>
                </div>
              </div>

              <div>
                <button
                  className="btn btn-yellow"
                  onClick={() => {
                    addToast('success', 'Request Active', 'Request marked active. FoodBridge will poll for upcoming restaurant surpluses.');
                    navigate(request ? `/requests/${request.requestId}` : '/requests');
                  }}
                >
                  <span>Keep Request Active</span>
                </button>
              </div>
            </div>
          ) : (
            /* Donor Cards Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '1.25rem'
            }}>
              {donors.map(donor => {
                const isSelected = selectedDonorIds.includes(donor.donorId);
                const canFullySupply = donor.availableQuantity >= requestedMeals;

                return (
                  <div
                    key={donor.donorId}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isSelected ? '2px solid #facc15' : '1px solid #1e293b',
                      backgroundColor: isSelected ? 'rgba(250, 204, 21, 0.05)' : '#151d30'
                    }}
                  >
                    <div>
                      {/* Donor Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                              {donor.donorId}
                            </span>
                            {donor.isUserCreated && (
                              <span className="badge badge-yellow" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                ✨ Real Source
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                            {donor.name}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="badge badge-green">
                            <span className="status-dot status-dot-green" />
                            Available
                          </span>
                          {donor.isUserCreated && (
                            <button
                              onClick={() => handleDeleteDonor(donor.donorId, donor.name)}
                              title="Delete this food source"
                              style={{
                                background: 'transparent',
                                border: '1px solid #334155',
                                borderRadius: 6,
                                padding: '0.25rem',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Donor Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#facc15', fontSize: '1.05rem', fontWeight: 700 }}>
                          <span>🍱</span>
                          <span>{donor.availableQuantity} meals available</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                          <MapPin size={15} className="text-slate-400" />
                          <span>{donor.distanceKm} km away • {donor.location}</span>
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', backgroundColor: '#090d16', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #1e293b' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{donor.foodType}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{donor.prepTime}</div>
                        </div>
                      </div>

                      {/* Single Match / Partial Match Indicator */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        {canFullySupply ? (
                          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={14} />
                            <span>Can fully cover {requestedMeals} meals</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: '#fb923c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <AlertTriangle size={14} />
                            <span>Partial supply: {donor.availableQuantity} of {requestedMeals} meals</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={`btn ${isSelected ? 'btn-secondary' : 'btn-outline'}`}
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                        onClick={() => toggleDonorSelection(donor)}
                      >
                        {isSelected ? 'Deselect' : 'Combine (+) '}
                      </button>

                      <button
                        className="btn btn-yellow"
                        style={{ flex: 1.2, fontSize: '0.8rem', padding: '0.5rem' }}
                        onClick={() => handleOpenMatchModal(donor)}
                      >
                        MATCH FOOD
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {modalDonor && (
        <div className="modal-backdrop" onClick={() => setModalDonor(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(250, 204, 21, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#facc15'
              }}>
                <Utensils size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  Create Food Rescue Match?
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Confirm allocation from this verified food surplus donor.
                </p>
              </div>
            </div>

            {/* Match Comparison Details */}
            <div style={{
              backgroundColor: '#090d16',
              borderRadius: 8,
              border: '1px solid #1e293b',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Food Required:</span>
                <strong style={{ color: '#facc15' }}>{requestedMeals} meals</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Food Available:</span>
                <strong style={{ color: '#34d399' }}>{modalDonor.availableQuantity} meals</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Donor:</span>
                <strong style={{ color: '#f8fafc' }}>{modalDonor.name}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Recipient:</span>
                <strong style={{ color: '#f8fafc' }}>{recipientArea}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Distance:</span>
                <strong style={{ color: '#38bdf8' }}>{modalDonor.distanceKm} km away</strong>
              </div>
            </div>

            {/* If partial match, show disclaimer */}
            {modalDonor.availableQuantity < requestedMeals && (
              <div style={{
                backgroundColor: 'rgba(250, 204, 21, 0.08)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                padding: '0.75rem',
                borderRadius: 6,
                fontSize: '0.8125rem',
                color: '#facc15',
                marginBottom: '1.25rem'
              }}>
                ⚠️ <strong>Partial Match Notice:</strong> This donor can supply {modalDonor.availableQuantity} meals. You will still require {requestedMeals - modalDonor.availableQuantity} meals after this match.
              </div>
            )}

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setModalDonor(null)}
                disabled={matchingInProgress}
              >
                CANCEL
              </button>

              <button
                className="btn btn-green"
                onClick={handleConfirmSingleMatch}
                disabled={matchingInProgress}
              >
                {matchingInProgress ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>CONFIRM MATCH</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Real Food Surplus Source */}
      {isAddDonorModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddDonorModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                    Register Food Surplus Source
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Add real donor data to FoodBridge & Crisis Map
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddDonorModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDonor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Facility / Donor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Palace Banquet Hall or Anna University Mess"
                  className="form-input"
                  value={newDonor.name}
                  onChange={e => setNewDonor({ ...newDonor, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Facility Category</label>
                  <select
                    className="form-select"
                    value={newDonor.facilityType}
                    onChange={e => setNewDonor({ ...newDonor, facilityType: e.target.value })}
                  >
                    <option value="COMMUNITY_KITCHEN">Community Kitchen / NGO</option>
                    <option value="COLLEGE_MESS">College / Hostel Mess</option>
                    <option value="WEDDING_HALL">Wedding / Convention Hall</option>
                    <option value="RESTAURANT">Restaurant / Hotel</option>
                    <option value="BAKERY">Bakery / Food Packager</option>
                    <option value="OTHER">Other Institution</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Surplus Quantity (Meals) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={newDonor.availableQuantity}
                    onChange={e => setNewDonor({ ...newDonor, availableQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Food Item Details *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepared Veg Pulao & Curd Rice (Hot Packed)"
                  className="form-input"
                  value={newDonor.foodType}
                  onChange={e => setNewDonor({ ...newDonor, foodType: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={13} className="text-yellow-400" />
                    Area / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Velachery, Chennai"
                    className="form-input"
                    value={newDonor.location}
                    onChange={e => setNewDonor({ ...newDonor, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Freshness / Prep Timing</label>
                  <input
                    type="text"
                    placeholder="e.g. Prepared 25 mins ago"
                    className="form-input"
                    value={newDonor.prepTime}
                    onChange={e => setNewDonor({ ...newDonor, prepTime: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Kitchen Supervisor"
                    className="form-input"
                    value={newDonor.contactPerson}
                    onChange={e => setNewDonor({ ...newDonor, contactPerson: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={13} className="text-green-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98401 23456"
                    className="form-input"
                    value={newDonor.contactPhone}
                    onChange={e => setNewDonor({ ...newDonor, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddDonorModalOpen(false)}
                  disabled={submittingDonor}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-green"
                  disabled={submittingDonor}
                >
                  {submittingDonor ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Save & Add to FoodBridge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
