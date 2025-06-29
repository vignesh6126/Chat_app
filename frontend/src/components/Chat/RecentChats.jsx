import { useEffect, useState } from 'react';
import { getRecentChats } from '../../services/database'; 

const RecentChats = ({ type, userId, onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const recentChats = await getRecentChats(userId, type);
        setChats(recentChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
  }, [userId, type]);

  if (loading) return <div>Loading chats...</div>;

  return (
    <div className="recent-chats">
      <h3>Recent {type === 'personal' ? 'Chats' : 'Rooms'}</h3>
      {chats.length > 0 ? (
        <ul>
          {chats.map(chat => (
            <li 
              key={chat.id} 
              onClick={() => onSelectChat({
                type,
                id: chat.id,
                ...(type === 'personal' && { otherUserId: chat.otherUserId })
              })}
            >
              {type === 'personal' ? chat.otherUserName : chat.roomName}
            </li>
          ))}
        </ul>
      ) : (
        <p>No recent {type === 'personal' ? 'chats' : 'rooms'} found</p>
      )}
    </div>
  );
};

export default RecentChats;