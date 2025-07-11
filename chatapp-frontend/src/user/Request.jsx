import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../user/Navbar';
import { MDBListGroup, MDBListGroupItem } from 'mdb-react-ui-kit';
import { getRequestAPI, updateRequestStatusAPI } from '../../Service/allapi';
import { server_url } from '../../Service/server_url';
import socket from '../socket';

// Utility for auth headers
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  if (!token) throw new Error('Authentication token missing');
  return { Authorization: `Bearer ${token}` };
};

// Utility for image error handling
const handleImageError = (e) => {
  e.target.src = `${server_url}/Uploads/default.jpg`;
};

function Request() {
  const [requests, setRequests] = useState([]);
  const userId = sessionStorage.getItem('userId');
  const token = sessionStorage.getItem('token');

  const fetchRequests = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await getRequestAPI(headers);
      setRequests(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setRequests([]);
    }
  }, [token]);

  useEffect(() => {
    if (userId && token) {
      fetchRequests();
      socket.emit('register_user', userId);

      socket.on('new_request', () => {
        fetchRequests();
      });

      return () => {
        socket.off('new_request');
      };
    }
  }, [userId, token, fetchRequests]);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };
      const res = await updateRequestStatusAPI(requestId, status, headers);
      if (res?.status === 200) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        if (status === 'accepted') {
          socket.emit('request_accepted', { senderId: userId, requestId });
        }
      } else {
        console.error('Failed to update request status');
      }
    } catch (err) {
      console.error('Error updating request:', err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Navbar />
      <MDBListGroup style={{ marginLeft: '50px', width: '1070px', marginTop: '32px' }} light>
        {requests.length === 0 ? (
          <div className="text-center mt-5">
            <img
              src="/notification.png"
              alt="No requests illustration"
              className="mb-3"
              style={{ width: '270px', marginTop: '25px', opacity: '0.7' }}
              onError={handleImageError}
            />
            <p className="text-muted fs-5">No Requests</p>
          </div>
        ) : (
          requests.map((r) => (
            <MDBListGroupItem
              key={r._id}
              tag="a"
              action
              noBorders
              color="light"
              className="px-3 rounded-3 mb-2 d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center">
                <img
                  src={`${server_url}/Uploads/${r.senderId?.image || 'default.jpg'}`}
                  alt="Profile"
                  style={{
                    width: '55px',
                    height: '55px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #ddd',
                    marginRight: '12px',
                  }}
                  onError={handleImageError}
                />
                <h5 style={{ fontWeight: 600, marginLeft: '5px', marginTop: '10px' }}>
                  {r.senderId && r.senderId.name ? r.senderId.name : 'Unknown'}
                </h5>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-danger"
                  onClick={() => handleUpdateStatus(r._id, 'declined')}
                >
                  Decline
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handleUpdateStatus(r._id, 'accepted')}
                >
                  Accept
                </button>
              </div>
            </MDBListGroupItem>
          ))
        )}
      </MDBListGroup>
    </div>
  );
}

export default Request;