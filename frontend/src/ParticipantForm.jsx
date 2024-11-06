import React, { useState } from 'react';

const ParticipantForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skiingAbility: 'beginner'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', email: '', skiingAbility: 'beginner' });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="participant-form">
      <div className="form-grid">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full name"
          className="input-field"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email address"
          className="input-field"
          required
        />
        <select
          name="skiingAbility"
          value={formData.skiingAbility}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <button type="submit" className="button">
          Add Participant
        </button>
      </div>
    </form>
  );
};

export default ParticipantForm;