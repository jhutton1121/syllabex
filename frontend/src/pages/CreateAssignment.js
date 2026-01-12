import React from 'react';
import AssignmentForm from '../components/AssignmentForm';

const CreateAssignment = () => {
  return (
    <div className="container">
      <AssignmentForm isEdit={false} />
    </div>
  );
};

export default CreateAssignment;
