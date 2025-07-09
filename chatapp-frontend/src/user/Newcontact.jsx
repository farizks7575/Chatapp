import React, { useEffect, useState } from 'react';
import Navbar from '../user/Navbar';
import { MDBListGroup, MDBListGroupItem } from 'mdb-react-ui-kit';
import { getallusersAPI, sendRequestAPI, getAcceptedRequestsAPI } from '../../Service/allapi';
import { server_url } from '../../Service/server_url';
import { FaUserPlus } from 'react-icons/fa';

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

function Newcontact() {
  const [users, setUsers] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loggedInUserId = sessionStorage.getItem('userId');
        const authToken = sessionStorage.getItem('token');
        if (!loggedInUserId || !authToken) {
          console.error('User ID or token not found');
          return;
        }
        setCurrentUserId(loggedInUserId);
        setToken(authToken);

        // Fetch all users
        const headers = getAuthHeaders();
        const result = await getallusersAPI(headers);
        if (result.status !== 200) {
          throw new Error('Failed to fetch users');
        }
        const filteredUsers = Array.isArray(result.data)
          ? result.data.filter((user) => user._id !== loggedInUserId)
          : [];
        setUsers(filteredUsers);

        // Fetch accepted connections
        const connections = await getAcceptedRequestsAPI(headers);
        if (connections.status !== 200) {
          throw new Error('Failed to fetch connections');
        }
        setConnectedUsers(Array.isArray(connections.data) ? connections.data.map((c) => c._id) : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setUsers([]);
        setConnectedUsers([]);
      }
    };

    fetchData();
  }, []);

  const handleSendRequest = async (receiverId) => {
    try {
      const headers = getAuthHeaders();
      const res = await sendRequestAPI(receiverId, headers);
      alert(res.data.message || 'Request sent successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send request');
      console.error('Error sending request:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Navbar />
      <MDBListGroup style={{ marginLeft: '50px', width: '1070px', marginTop: '32px' }} light>
        {users.length === 0 ? (
          <p className="text-center mt-5 text-muted">No users available</p>
        ) : (
          users.map((user, index) => (
            <MDBListGroupItem
              key={user._id || index}
              tag="a"
              action
              noBorders
              color="success"
              className="px-3 rounded-3 mb-2 d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center">
                <img
                  src={`${server_url}/Uploads/${user.image || 'default.jpg'}`}
                  alt="profile"
                  style={{ width: '55px', height: '55px', borderRadius: '50%', marginRight: '12px' }}
                  onError={handleImageError}
                />
                <h3 style={{ fontWeight: 600, marginTop: '10px', marginLeft: '5px' }}>
                  {user && user.name ? user.name : 'Unnamed'}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {connectedUsers.includes(user._id) ? (
                  <button type="button" className="btn btn-secondary" disabled>
                    Connected
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSendRequest(user._id)}
                  >
                    <FaUserPlus style={{ marginRight: '15px', marginBottom: '3px', fontSize: '18px' }} />
                    Connect
                  </button>
                )}
              </div>
            </MDBListGroupItem>
          ))
        )}
      </MDBListGroup>
    </div>
  );
}

export default Newcontact;