const SUPABASE_URL = 'https://jnukdmdfqwgtphachnwe.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudWtkbWRmcXdndHBoYWNobndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExODA1MTAsImV4cCI6MjEwNjc1NjUxMH0.9EQ3IetABLujDR0YWHAmcBZMtMFVYuLLeL0XzF18HKE'.trim();
const TABLE_NAME = 'students';

let supabaseClient = null;
try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
        global: {
            headers: { 'x-client-info': 'student-management-system' }
        }
    });
    checkConnection();
    fetchStudents();
} catch (err) {
    console.error('Failed to initialize Supabase client:', err);
}

let studentsCache = [];

async function checkConnection() {
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('id')
            .limit(1);

        if (error) throw error;
        console.log('Connected to Supabase successfully!');
    } catch (err) {
        console.error('Connection check failed:', err.message);
    }
}

async function fetchStudents() {
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        studentsCache = data || [];
        renderStudents(studentsCache);
    } catch (err) {
        console.error('Error fetching students:', err.message);
    }
}

function renderStudents(students) {
    const container = document.getElementById('studentsTableBody') || document.getElementById('registeredStudentsList');
    if (!container) return;

    if (students.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-400">No student records found.</td></tr>`;
        return;
    }

    container.innerHTML = students.map(student => `
        <tr class="border-b border-gray-800 hover:bg-gray-800/50">
            <td class="py-3 px-4">${escapeHtml(student.name || student.student_name || '')}</td>
            <td class="py-3 px-4">${escapeHtml(student.email || '')}</td>
            <td class="py-3 px-4">${escapeHtml(student.course || student.enrolled_course || '')}</td>
            <td class="py-3 px-4 text-right">
                <button onclick="deleteStudent('${student.id}')" class="text-rose-400 hover:text-rose-300">Delete</button>
            </td>
        </tr>
    `).join('');
}

const studentForm = document.getElementById('studentForm');
if (studentForm) {
    studentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('studentName').value.trim();
        const email = document.getElementById('studentEmail').value.trim();
        const course = document.getElementById('studentCourse').value.trim();

        try {
            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .insert([{ name, email, course }]);

            if (error) throw error;

            studentForm.reset();
            fetchStudents();
        } catch (err) {
            console.error('Error adding student:', err.message);
            alert('Failed to save student record: ' + err.message);
        }
    });
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student record?')) return;

    try {
        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .delete()
            .match({ id });

        if (error) throw error;
        fetchStudents();
    } catch (err) {
        console.error('Error deleting student:', err.message);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}