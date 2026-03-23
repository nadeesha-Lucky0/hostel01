import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import NavigationBar from './components/NavigationBar'
import Dashboard from './pages/Dashboard'
import FloorAndRoomManagement from './pages/FloorAndRoomManagement'
import StudentApplications from './pages/StudentApplications'
import Records from './pages/Records'
import Landing from './pages/Landing'
import Complaints from './pages/Complaints'
import WardenComplaintChat from './pages/WardenComplaintChat'
import StudentDashboard from './pages/StudentDashboard'
import StudentComplaintChat from './pages/StudentComplaintChat'
import Notices from './pages/Notices'
import NoticeDetail from './pages/NoticeDetail'
import Profiles from './pages/Profiles'
import { useState } from 'react'

import StudentNavigationBar from './components/StudentNavigationBar'
import FinancialNavigationBar from './components/FinancialNavigationBar'
import FinancialDashboard from './pages/FinancialDashboard'
import FinancialRecords from './pages/FinancialRecords'
import SecurityNavigationBar from './components/SecurityNavigationBar'
import SecurityDashboard from './pages/SecurityDashboard'
import SecurityRecords from './pages/SecurityRecords'
import StudentInOut from './pages/StudentInOut'
import PublicStudentInOut from './pages/PublicStudentInOut'
import WardenScanRecords from './pages/WardenScanRecords'

const AppLayout = () => (
    <div className="flex flex-col min-h-screen">
        <NavigationBar />
        <main className="flex-grow pt-[80px]">
            <Outlet />
        </main>
    </div>
)

const StudentLayout = () => (
    <div className="flex flex-col min-h-screen">
        <StudentNavigationBar />
        <main className="flex-grow pt-[80px]">
            <Outlet />
        </main>
    </div>
)

const FinancialLayout = () => (
    <div className="flex flex-col min-h-screen">
        <FinancialNavigationBar />
        <main className="flex-grow pt-[80px]">
            <Outlet />
        </main>
    </div>
)

const SecurityLayout = () => (
    <div className="flex flex-col min-h-screen">
        <SecurityNavigationBar />
        <main className="flex-grow pt-[80px]">
            <Outlet />
        </main>
    </div>
)
function App() {
    // Shared state for allocation flow
    const [allocatingStudent, setAllocatingStudent] = useState(null)

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                        fontFamily: 'Inter, sans-serif'
                    }
                }}
            />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/notice/:id" element={<NoticeDetail />} />
                <Route path="/public/in-out" element={<PublicStudentInOut />} />

                {/* Student Routes (with StudentNavigationBar) */}
                <Route element={<StudentLayout />}>
                    <Route path="/student" element={<StudentDashboard />} />
                    <Route path="/student/applications" element={<StudentDashboard />} />
                    <Route path="/student/payments" element={<StudentDashboard />} />
                    <Route path="/student/chats" element={<StudentDashboard />} />
                    <Route path="/student/complaint/:id" element={<StudentComplaintChat />} />
                    <Route path="/student/in-out" element={<StudentInOut />} />
                </Route>

                {/* Warden/Staff Routes (with NavigationBar) */}
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route 
                        path="/room-management" 
                        element={
                            <FloorAndRoomManagement 
                                allocatingStudent={allocatingStudent}
                                setAllocatingStudent={setAllocatingStudent}
                            />
                        } 
                    />
                    <Route
                        path="/student-applications"
                        element={
                            <StudentApplications
                                setAllocatingStudent={setAllocatingStudent}
                            />
                        }
                    />
                    <Route path="/records" element={<Records />} />
                    <Route path="/complaints" element={<Complaints />} />
                    <Route path="/complaints/:id" element={<WardenComplaintChat />} />
                    <Route path="/notices" element={<Notices />} />
                    <Route path="/profiles" element={<Profiles />} />
                    <Route path="/warden/scan-records" element={<WardenScanRecords />} />
                </Route>

                {/* Financial Manager Routes */}
                <Route element={<FinancialLayout />}>
                    <Route path="/financial/dashboard" element={<FinancialDashboard />} />
                    <Route path="/financial/records" element={<FinancialRecords />} />
                </Route>

                {/* Security Officer Routes */}
                <Route element={<SecurityLayout />}>
                    <Route path="/security/dashboard" element={<SecurityDashboard />} />
                    <Route path="/security/records" element={<SecurityRecords />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    )
}

export default App
