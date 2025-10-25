function onFilesChange(files) {
  this.file = files[0];
}

function onFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    // Check if it's a GPX file by extension or MIME type
    const fileName = file.name.toLowerCase();
    const isValidGpx = fileName.endsWith('.gpx') || 
                      file.type === 'application/gpx+xml' || 
                      file.type === 'application/octet-stream' ||
                      file.type === 'text/xml';
    
    if (!isValidGpx) {
      // Not a GPX file, reset and show error
      event.target.value = ''; // Clear the input
      this.$emit('error', 'Please select a valid GPX file (with .gpx extension)');
      return;
    }
    
    this.file = file;
    this.onSubmit();
  }
}

function onCancel() {
  this.file = null;
}

function onSubmit() {
  if (this.file) {
    this.$emit('submit', this.file);
  }
}

const FileUpload = {
  template: '#file-upload-template',
  data: () => ({
    file: null
  }),
  methods: {
    onFilesChange,
    onFileSelect,
    onCancel,
    onSubmit
  }
};

export default FileUpload;