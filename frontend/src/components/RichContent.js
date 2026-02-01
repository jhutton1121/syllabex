import React from 'react';
import './RichContent.css';

function RichContent({ html, className }) {
  if (!html) return null;

  return (
    <div
      className={`rich-content ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default RichContent;
