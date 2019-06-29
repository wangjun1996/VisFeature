--[[
	/****************************************************************************
	 * classic-pseaac.lua - Copyright 2017 Pu-Feng Du, Ph.D.                    *
	 *                                                                          *
	 * This file is a part of the software: UltraPse                            *
	 * UltraPse is free software: you can redistribute it and/or modify         *
	 * it under the terms of the GNU General Public License as published by     *
	 * the Free Software Foundation, either version 3 of the License, or        *
	 * (at your option) any later version.                                      *
	 *                                                                          *
	 * UltraPse is distributed in the hope that it will be useful,              *
	 * but WITHOUT ANY WARRANTY; without even the implied warranty of           *
	 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the            *
	 * GNU General Public License for more details.                             *
	 *                                                                          *
	 * You should have received a copy of the GNU General Public License        *
	 * along with UltraPse.  If not, see <http://www.gnu.org/licenses/>.        *
	 ****************************************************************************/

	Task definition file for :

	Classic Pseudo amino acid composition (PseAAC) - Type I / II

	As the Type I/II PseAAC require some physicochemical properties that are not
	resides in the AAIndex database. We provide this task definition for the users 
	who needs to produce exactly the same representations.

	To produce a Classic PseAAC Type - I, use the following command:

	upse -i test/tiny.fas -u tdfs/classic-pseaac.lua -n stdprot -m pse -t 1 -l 10 -w 0.05 -p CPSEH1 -p CPSEH2 -p CPSEM -f svm

	The "test/tinu.fas" is your fasta file, you can change the name
	The "-l 10 -w 0.05" specify the Lambda and Oemga parameters in PseAAC
	The CPSEH1, CPSEH2 and CPSEM are the names of physicochemical properties for PseAAC

	To produce a Classic PseAAC Type - II, use the following command:

	upse -i test/tiny.fas -u tdfs/classic-pseaac.lua -n stdprot -m pse -t 2 -l 10 -w 0.05 -p CPSEH1 -p CPSEH2 -f svm

	The "test/tinu.fas" is your fasta file, you can change the name
	The "-l 10 -w 0.05" specify the Lambda and Oemga parameters in PseAAC
	The CPSEH1 and CPSEH2 are the names of physicochemical properties for PseAAC
--]]

H1 = {
	Template="";
	ID = "CPSEH1";
	Values =
	{
		A = 0.62;	C = 0.29;	D = -0.9;	E = -0.74;
		F = 1.19;	G = 0.48;	H = -0.4;	I = 1.38;
		K = -1.5;	L = 1.06;	M = 0.64;	N = -0.78;
		P = 0.12;	Q = -0.85;	R = -2.53;	S = -0.18;
		T = -0.05;	V = 1.08;	W = 0.81;	Y = 0.26; 
	};
	Comment = "H1 in Classic PseAAC";
};

H2 = {
	Template="";
	ID = "CPSEH2";
	Values =
	{
		A = -0.5;	C = -1.0;	D = 3.0;	E = 3.0;
		F = -2.5;	G = 0.0;	H = -0.5;	I = -1.8;
		K = 3.0;	L = -1.8;	M = -1.3;	N = 0.2;
		P = 0.0;	Q = 0.2;	R = 3.0;	S = 0.3;
		T = -0.4;	V = -1.5;	W = -3.4;	Y = -2.3;
	};
	Comment = "H2 in Classic PseAAC";
};

MASS = {
	Template="";
	ID = "CPSEM";
	Values =
	{
		A = 15;	C = 47;	D = 59;	E = 73;
		F = 91; G = 1;	H = 82; I = 57;
		K = 73; L = 57; M = 75; N = 58;
		P = 42; Q = 72; R = 101; S = 31;
		T = 45; V = 43; W = 130; Y = 107;
	};
	Comment = "Mass in Classic PseAAC";
};
AddModule("PSE")
SetNotation("STDPROT")
DefineProperty(H1)
DefineProperty(H2)
DefineProperty(MASS)
AddProperty("CPSEH1")
AddProperty("CPSEH2")
if (GetOption("_cmd_subtype") == "1") then
	AddProperty("CPSEM")
end

