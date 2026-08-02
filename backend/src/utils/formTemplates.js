const TEMPLATE_DEFINITIONS = {
  event_registration: {
    label: 'Event Registration',
    defaultTitle: 'Event Registration Form',
    description: 'Collect attendee details and preferences for your event.',
    contextKey: 'eventName',
    formType: 'registration'
  },
  job_application: {
    label: 'Job Application',
    defaultTitle: 'Job Application Form',
    description: 'Gather applicant information, skills, and experience.',
    contextKey: 'companyName',
    formType: 'registration'
  },
  customer_feedback: {
    label: 'Customer Feedback',
    defaultTitle: 'Customer Feedback Form',
    description: 'Measure satisfaction, pain points, and suggestions.',
    contextKey: 'companyName',
    formType: 'feedback'
  },
  course_feedback: {
    label: 'Course Feedback',
    defaultTitle: 'Course Feedback Form',
    description: 'Collect feedback on course quality and learning outcomes.',
    contextKey: 'courseName',
    formType: 'feedback'
  },
  product_survey: {
    label: 'Product Survey',
    defaultTitle: 'Product Survey Form',
    description: 'Understand usage patterns and feature priorities.',
    contextKey: 'productName',
    formType: 'survey'
  },
  lead_capture: {
    label: 'Lead Capture',
    defaultTitle: 'Lead Capture Form',
    description: 'Capture contact details and qualification signals.',
    contextKey: 'companyName',
    formType: 'registration'
  }
};

export function listTemplateDefinitions() {
  return TEMPLATE_DEFINITIONS;
}

export function getTemplateDefinition(templateType) {
  return TEMPLATE_DEFINITIONS[templateType] || null;
}
