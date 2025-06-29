import { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, storage, db } from '../../firebase';

const ProfileEditor = () => {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
      setPhone(auth.currentUser.phoneNumber || '');
      setPhotoURL(auth.currentUser.photoURL || '');
    }
  }, []);

  const handleSave = async () => {
    try {
      let photoUrl = photoURL;
      if (photoFile) {
        const storageRef = ref(storage, `profilePhotos/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoUrl
      });

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName,
        phone,
        photoURL: photoUrl
      });

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="profile-editor">
      <div className="profile-photo">
        <img src={photoURL || '/default-avatar.png'} alt="Profile" />
        <input 
          type="file" 
          onChange={(e) => setPhotoFile(e.target.files[0])} 
          accept="image/*"
        />
      </div>
      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <button onClick={handleSave}>Save Profile</button>
    </div>
  );
};