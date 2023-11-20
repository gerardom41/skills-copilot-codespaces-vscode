// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

// Create express app
const app = express();
// Add body parser middleware
app.use(bodyParser.json());
// Add cors middleware
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Add route to get all comments
app.get('/posts/:id/comments', (req, res) => {
  // Send comments for post
  res.send(commentsByPostId[req.params.id] || []);
});

// Add route to create comment
app.post('/posts/:id/comments', async (req, res) => {
  // Create comment id
  const commentId = randomBytes(4).toString('hex');
  // Get content from body
  const { content } = req.body;
  // Get comments for post
  const comments = commentsByPostId[req.params.id] || [];
  // Add comment to comments
  comments.push({ id: commentId, content, status: 'pending' });
  // Add comments to commentsByPostId
  commentsByPostId[req.params.id] = comments;
  // Send comment back
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });
  // Send comments for post
  res.status(201).send(comments);
});

// Add route to receive events
app.post('/events', async (req, res) => {
  // Get event
  const { type, data } = req.body;
  // Check event type
  if (type === 'CommentModerated') {
    // Get comment
    const comment = commentsByPostId[data.postId].find(
      (comment) => comment.id === data.id
    );
    // Update comment
    comment.status = data.status;
    // Send event
    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data,
    });
  }
  // Send response
  res.send({});
});

// Start web server
app.listen(4001, () => {
  console.log('Listening on port 4001');
});