'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CourseContents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      text: {
        type: Sequelize.TEXT
      },
      url: {
        type: Sequelize.STRING
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false, // courseId cannot be null
        references: {
          model: 'Courses', // Name of the referenced table
          key: 'id' // Primary key of the referenced table
        },
        onUpdate: 'CASCADE', // Cascade update if the referenced course id changes
        onDelete: 'CASCADE' // Cascade delete if the referenced course is deleted
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CourseContents');
  }
};
