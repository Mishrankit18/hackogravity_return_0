let currentStepNum = 1;
        let uploadedFiles = [];

        // Quick Exit Function
        function quickExit() {
            // Clear all form data
            document.querySelectorAll('input, textarea, select').forEach(el => {
                if (el.type === 'checkbox') el.checked = false;
                else el.value = '';
            });
            
            // Clear uploaded files
            uploadedFiles = [];
            updateFileList();
            
            // Redirect to YouTube in same tab
            window.location.href = 'https://www.youtube.com';
        }

        // Voice Recording Variables
        let mediaRecorder;
        let recordedChunks = [];
        let recordingTimer;
        let recordingStartTime;
        let audioBlob;

        // Navigation Functions
        function showHome() {
            document.querySelectorAll('.fade-in').forEach(el => el.classList.add('hidden'));
            document.getElementById('homePage').classList.remove('hidden');
            resetForm();
            resetVoiceForm();
        }

        function startReport() {
            document.getElementById('homePage').classList.add('hidden');
            document.getElementById('reportForm').classList.remove('hidden');
            updateProgress();
        }

        function startVoiceReport() {
            document.getElementById('homePage').classList.add('hidden');
            document.getElementById('voiceReportForm').classList.remove('hidden');
        }

        function showTracking() {
            document.querySelectorAll('.fade-in').forEach(el => el.classList.add('hidden'));
            document.getElementById('trackingPage').classList.remove('hidden');
        }

        // Voice Recording Functions
        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                recordedChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                    stream.getTracks().forEach(track => track.stop());
                    document.getElementById('playRecordBtn').classList.remove('hidden');
                    document.getElementById('voiceComplaintDetails').classList.remove('hidden');
                    validateVoiceForm();
                };
                
                mediaRecorder.start();
                recordingStartTime = Date.now();
                
                // Update UI
                document.getElementById('startRecordBtn').classList.add('hidden');
                document.getElementById('stopRecordBtn').classList.remove('hidden');
                document.getElementById('recordingWaveform').classList.remove('hidden');
                document.getElementById('recordingStatus').textContent = 'Recording in progress...';
                
                // Start timer
                recordingTimer = setInterval(updateRecordingTimer, 1000);
                
            } catch (error) {
                document.getElementById('recordingStatus').textContent = 'Microphone access denied. Please allow microphone access and try again.';
                document.getElementById('recordingStatus').className = 'text-lg font-medium text-red-600 mb-4';
            }
        }
        
        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                clearInterval(recordingTimer);
                
                // Update UI
                document.getElementById('startRecordBtn').classList.remove('hidden');
                document.getElementById('stopRecordBtn').classList.add('hidden');
                document.getElementById('recordingWaveform').classList.add('hidden');
                document.getElementById('recordingStatus').textContent = 'Recording completed. Review and submit your complaint.';
                document.getElementById('recordingStatus').className = 'text-lg font-medium text-green-600 mb-4';
            }
        }
        
        function playRecording() {
            if (audioBlob) {
                const audio = new Audio(URL.createObjectURL(audioBlob));
                audio.play();
            }
        }
        
        function updateRecordingTimer() {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('recordingTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        function validateVoiceForm() {
            const complaintType = document.getElementById('voiceComplaintType').value;
            const entity = document.getElementById('voiceGovernmentEntity').value;
            const submitBtn = document.getElementById('submitVoiceBtn');
            
            submitBtn.disabled = !(audioBlob && complaintType && entity);
        }
        
        function submitVoiceReport() {
            const whistleId = generateWhistleId();
            document.getElementById('generatedWhistleId').textContent = whistleId;
            
            document.getElementById('voiceReportForm').classList.add('hidden');
            document.getElementById('submissionSuccess').classList.remove('hidden');
        }
        
        function resetVoiceForm() {
            // Reset recording state
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
            if (recordingTimer) {
                clearInterval(recordingTimer);
            }
            
            // Reset UI
            document.getElementById('startRecordBtn').classList.remove('hidden');
            document.getElementById('stopRecordBtn').classList.add('hidden');
            document.getElementById('playRecordBtn').classList.add('hidden');
            document.getElementById('recordingWaveform').classList.add('hidden');
            document.getElementById('voiceComplaintDetails').classList.add('hidden');
            document.getElementById('recordingStatus').textContent = 'Ready to record your complaint';
            document.getElementById('recordingStatus').className = 'text-lg font-medium text-gray-700 mb-4';
            document.getElementById('recordingTimer').textContent = '00:00';
            
            // Reset form fields
            document.getElementById('voiceComplaintType').value = '';
            document.getElementById('voiceGovernmentEntity').value = '';
            document.getElementById('voicePassphrase').value = '';
            
            // Reset variables
            recordedChunks = [];
            audioBlob = null;
        }

        // Form Navigation
        function nextStep() {
            if (validateCurrentStep()) {
                document.getElementById(`step${currentStepNum}`).classList.add('hidden');
                currentStepNum++;
                document.getElementById(`step${currentStepNum}`).classList.remove('hidden');
                updateProgress();
                
                if (currentStepNum === 4) {
                    generateReviewSummary();
                }
            }
        }

        function prevStep() {
            document.getElementById(`step${currentStepNum}`).classList.add('hidden');
            currentStepNum--;
            document.getElementById(`step${currentStepNum}`).classList.remove('hidden');
            updateProgress();
        }

        function updateProgress() {
            const progress = (currentStepNum / 4) * 100;
            document.getElementById('currentStep').textContent = currentStepNum;
            document.getElementById('progressPercent').textContent = progress;
            document.getElementById('progressBar').style.width = progress + '%';
        }

        // Validation Functions
        function validateCurrentStep() {
            switch(currentStepNum) {
                case 1:
                    return validateStep1();
                case 2:
                    return validateStep2();
                case 3:
                    return true; // Evidence upload is optional
                case 4:
                    return true;
                default:
                    return false;
            }
        }

        function validateStep1() {
            return document.getElementById('consentAll').checked;
        }

        function validateStep2() {
            const complaintType = document.getElementById('complaintType').value;
            const governmentEntity = document.getElementById('governmentEntity').value;
            const incidentDate = document.getElementById('incidentDate').value;
            const location = document.getElementById('location').value;
            const narrative = document.getElementById('narrative').value;
            
            // Check if basic fields are filled
            if (!complaintType || !governmentEntity || !incidentDate || !location.trim() || !narrative.trim()) {
                return false;
            }
            
            // Check if "other" options have their text fields filled
            if (complaintType === 'other' && !document.getElementById('otherComplaintText').value.trim()) {
                return false;
            }
            
            if (governmentEntity === 'other-entity' && !document.getElementById('otherEntityText').value.trim()) {
                return false;
            }
            
            return true;
        }

        // Consent checkbox validation
        document.addEventListener('DOMContentLoaded', function() {
            const consentCheckbox = document.getElementById('consentAll');
            const nextButton = document.getElementById('step1Next');
            
            consentCheckbox.addEventListener('change', function() {
                nextButton.disabled = !consentCheckbox.checked;
            });

            // Step 2 validation and "Other" option handling
            const step2Fields = ['complaintType', 'governmentEntity', 'incidentDate', 'location', 'narrative'];
            const step2Button = document.getElementById('step2Next');
            
            // Handle complaint type "Other" option
            document.getElementById('complaintType').addEventListener('change', function() {
                const otherBox = document.getElementById('otherComplaintBox');
                if (this.value === 'other') {
                    otherBox.classList.remove('hidden');
                } else {
                    otherBox.classList.add('hidden');
                    document.getElementById('otherComplaintText').value = '';
                }
                validateStep2Form();
            });
            
            // Handle government entity "Other" option
            document.getElementById('governmentEntity').addEventListener('change', function() {
                const otherBox = document.getElementById('otherEntityBox');
                if (this.value === 'other-entity') {
                    otherBox.classList.remove('hidden');
                } else {
                    otherBox.classList.add('hidden');
                    document.getElementById('otherEntityText').value = '';
                }
                validateStep2Form();
            });
            
            // Add validation for all step 2 fields including "other" text boxes
            step2Fields.forEach(id => {
                document.getElementById(id).addEventListener('input', validateStep2Form);
            });
            
            document.getElementById('otherComplaintText').addEventListener('input', validateStep2Form);
            document.getElementById('otherEntityText').addEventListener('input', validateStep2Form);
            
            function validateStep2Form() {
                step2Button.disabled = !validateStep2();
            }
        });

        // File Upload Functions
        document.addEventListener('DOMContentLoaded', function() {
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fileInput');

            dropZone.addEventListener('click', () => fileInput.click());

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                handleFiles(e.dataTransfer.files);
            });

            fileInput.addEventListener('change', (e) => {
                handleFiles(e.target.files);
            });
        });

        function handleFiles(files) {
            Array.from(files).forEach(file => {
                if (file.size <= 50 * 1024 * 1024) { // 50MB limit
                    uploadedFiles.push({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        id: Date.now() + Math.random()
                    });
                }
            });
            updateFileList();
        }

        function updateFileList() {
            const fileList = document.getElementById('fileList');
            const fileCount = document.getElementById('fileCount');
            
            fileList.innerHTML = '';
            uploadedFiles.forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg';
                fileDiv.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <span class="text-green-400">📄</span>
                        <div>
                            <div class="font-medium">${file.name}</div>
                            <div class="text-sm text-gray-400">${(file.size / 1024 / 1024).toFixed(2)} MB - Metadata Stripped</div>
                        </div>
                    </div>
                    <button onclick="removeFile('${file.id}')" class="text-red-400 hover:text-red-300">✕</button>
                `;
                fileList.appendChild(fileDiv);
            });
            
            fileCount.textContent = uploadedFiles.length;
        }

        function removeFile(fileId) {
            uploadedFiles = uploadedFiles.filter(file => file.id != fileId);
            updateFileList();
        }

        // Review Summary
        function generateReviewSummary() {
            const summary = document.getElementById('reviewSummary');
            const complaintType = document.getElementById('complaintType').value;
            const entity = document.getElementById('governmentEntity').value;
            const date = document.getElementById('incidentDate').value;
            const location = document.getElementById('location').value;
            
            summary.innerHTML = `
                <div><strong>Complaint Type:</strong> ${complaintType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div><strong>Government Entity:</strong> ${entity.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div><strong>Date:</strong> ${date}</div>
                <div><strong>Location:</strong> ${location}</div>
                <div><strong>Files Uploaded:</strong> ${uploadedFiles.length} files</div>
            `;
        }

        // Submit Report
        function submitReport() {
            const whistleId = generateWhistleId();
            document.getElementById('generatedWhistleId').textContent = whistleId;
            
            document.getElementById('reportForm').classList.add('hidden');
            document.getElementById('submissionSuccess').classList.remove('hidden');
        }

        function generateWhistleId() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = 'WBL-';
            for (let i = 0; i < 10; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }

        // Tracking Functions
        function trackReport() {
            const trackingId = document.getElementById('trackingId').value.trim();
            const passphrase = document.getElementById('trackingPassphrase').value.trim();
            
            // Clear any previous results
            document.getElementById('trackingResults').classList.add('hidden');
            document.getElementById('trackingError').classList.add('hidden');
            
            if (!trackingId || !passphrase) {
                showTrackingError('Please enter both WhistleID and passphrase.');
                return;
            }
            
            // Validate WhistleID format (should start with WBL- and be correct length)
            if (!trackingId.match(/^WBL-[A-Z0-9]{10}$/)) {
                showTrackingError('Invalid WhistleID format. Please check your credentials.');
                return;
            }
            
            // Simulate credential validation (in real app, this would be server-side)
            // For demo purposes, only accept specific test credentials
            const validCredentials = [
                { id: 'WBL-9J47T2R1P8', pass: 'test123' },
                { id: 'WBL-ABC1234567', pass: 'demo456' }
            ];
            
            const isValid = validCredentials.some(cred => 
                cred.id === trackingId && cred.pass === passphrase
            );
            
            if (isValid) {
                document.getElementById('trackingResults').classList.remove('hidden');
            } else {
                showTrackingError('Invalid credentials. Please check your WhistleID and passphrase.');
            }
        }
        
        function showTrackingError(message) {
            const errorDiv = document.getElementById('trackingError');
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }

        function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const messageHistory = document.getElementById('messageHistory');
            
            if (messageInput.value.trim()) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'bg-green-600 p-3 rounded-lg max-w-xs ml-auto';
                messageDiv.innerHTML = `
                    <p class="text-sm">${messageInput.value}</p>
                    <span class="text-xs text-green-200">${new Date().toLocaleString()}</span>
                `;
                messageHistory.appendChild(messageDiv);
                messageInput.value = '';
                messageHistory.scrollTop = messageHistory.scrollHeight;
            }
        }

        function resetForm() {
            currentStepNum = 1;
            uploadedFiles = [];
            document.querySelectorAll('input, textarea, select').forEach(el => {
                if (el.type === 'checkbox') el.checked = false;
                else el.value = '';
            });
            document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
            document.getElementById('step1').classList.remove('hidden');
            updateProgress();
            updateFileList();
        }

        // Enter key handling for message input
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('messageInput')?.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            // Voice form validation
            document.getElementById('voiceComplaintType')?.addEventListener('change', validateVoiceForm);
            document.getElementById('voiceGovernmentEntity')?.addEventListener('change', validateVoiceForm);
        });
