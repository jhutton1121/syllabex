import React from 'react';
import CourseForm from '../../components/CourseForm';

const CreateCourse = () => {
  return (
    <div className="container">
      <CourseForm isEdit={false} />
    </div>
  );
};

export default CreateCourse;
